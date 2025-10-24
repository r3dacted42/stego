<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import ImageDropZone from './ImageDropZone.vue';
import imgEncMsgSizeWorker from '../workers/imgEncMsgSize.worker.ts?worker';
import imgEncProcWorker from '../workers/imgEncProc.worker.ts?worker';
import type { ImgEncMsgSizeReq, ImgEncMsgSizeRes, ImgEncProcReq, ImgEncProcRes } from '../workers/types';
import { getNamedB64 } from '../utils';

const imageFile = ref<File>();
const maxByteSize = ref(0);
const msgType = ref<'text' | 'file'>('text');
const message = ref('');
const isEncoding = ref(false);
const imgRef = useTemplateRef("preview-img");
const encImgSrc = ref('');
const errorMsg = ref('');
const dialogRef = useTemplateRef("err-dialog");

const canChangePayload = computed(() => {
    return (!imageFile.value || isEncoding.value);
});

const handleImageDropped = (img: File) => {
    imageFile.value = img;
}

const handlePayloadFileChange = (ev: Event) => {
    const tgt = ev.target as HTMLInputElement;
    const file = tgt.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const b64 = reader.result as string;
        message.value = getNamedB64(b64, file.name);
    };
}

const msgSizeWorker = new imgEncMsgSizeWorker();
msgSizeWorker.onmessage = (ev: MessageEvent<ImgEncMsgSizeRes>) => {
    const { size, error } = ev.data;
    errorMsg.value = error ?? "";
    if (error && dialogRef.value) dialogRef.value.showModal();
    if (!size) return;
    maxByteSize.value = size;
};
msgSizeWorker.onerror = (e) => {
    console.error("error in msgSizeWorker: ", e);
};
watch((imageFile), async (newImageFile) => {
    if (!newImageFile) return;
    try {
        const bitmap = await createImageBitmap(newImageFile);
        const req: ImgEncMsgSizeReq = { bitmap };
        msgSizeWorker.postMessage(req, [bitmap]);
    } catch (error) {
        errorMsg.value = `failed to create ImageBitmap: ${error}`;
        if (error && dialogRef.value) dialogRef.value.showModal();
    }
});

const textEncoder = new TextEncoder();
const currentByteSize = computed(() => {
    return textEncoder.encode(message.value).length;
});

const encWorker = new imgEncProcWorker();
encWorker.onmessage = (ev: MessageEvent<ImgEncProcRes>) => {
    isEncoding.value = false;
    if (encImgSrc.value) URL.revokeObjectURL(encImgSrc.value);
    const { imageData, error } = ev.data;
    errorMsg.value = error ?? "";
    if (error && dialogRef.value) dialogRef.value.showModal();
    if (!imageData || !imgRef.value) return;
    const canvas = document.createElement('canvas');
    canvas.width = imageData.width;
    canvas.height = imageData.height;
    const ctx = canvas.getContext('2d');
    ctx?.putImageData(imageData, 0, 0);
    canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        encImgSrc.value = url;
    }, 'image/png', 1.0); // 'image/png', quality 1.0 (max)
};
encWorker.onerror = (e) => {
    isEncoding.value = false;
    console.error("error in encWorker: ", e);
};
const encodeImage = async () => {
    if (!imageFile.value) return;
    try {
        isEncoding.value = true;
        const bitmap = await createImageBitmap(imageFile.value);
        const req: ImgEncProcReq = { bitmap: bitmap, message: message.value };
        encWorker.postMessage(req, [bitmap]);
    } catch (error) {
        isEncoding.value = false;
        errorMsg.value = `failed to create ImageBitmap: ${error}`;
        if (error && dialogRef.value) dialogRef.value.showModal();
    }
}

onBeforeUnmount(() => {
    msgSizeWorker.terminate();
    encWorker.terminate();
    if (encImgSrc.value) URL.revokeObjectURL(encImgSrc.value);
});
</script>

<template>
    <h3>encode</h3>
    <p>select an image to encode with data</p>
    <ImageDropZone v-on:image-dropped="handleImageDropped" :disabled="isEncoding" />

    <p>payload</p>
    <span class="msg-type">
        <label>
            <input type="radio" v-model="msgType" name="msgType" value="text" :disabled="canChangePayload" />
            text
        </label>
        <label>
            <input type="radio" v-model="msgType" name="msgType" value="file" :disabled="canChangePayload" />
            file
        </label>
    </span>
    <textarea v-if="msgType === 'text'" :disabled="canChangePayload" v-model="message" rows="5"
        placeholder="super secret message..." :invalid="currentByteSize > maxByteSize" id="message"></textarea>
    <input v-if="msgType === 'file'" @change="handlePayloadFileChange" type="file" :disabled="canChangePayload" />
    <small class="full-width" style="text-align: end;">{{ currentByteSize }} / {{ maxByteSize ?? "?" }} bytes</small>

    <button type="button" @click="encodeImage"
        :disabled="!imageFile || (currentByteSize > maxByteSize) || !currentByteSize || isEncoding">
        encode
    </button>
    <p></p>
    <label :aria-disabled="!encImgSrc" class="border img-div">
        <span v-if="!encImgSrc">encoded image preview</span>
        <a :href="encImgSrc" :download="imageFile?.name">
            <img :src="encImgSrc" ref="preview-img"></img>
        </a>
    </label>

    <dialog ref="err-dialog" closedby="none">
        error: {{ errorMsg }} <br />
        <button type="button" @click="dialogRef?.close()">okay</button>
    </dialog>
</template>

<style scoped>
.msg-type {
    margin-top: -1em;
    margin-bottom: 1em;
    display: flex;
    flex-direction: row;
    gap: 1em;
}

.img-div {
    place-content: center;
    height: fit-content;
    min-height: 12em;
    padding: var(--border-radius);

    img {
        max-width: 100%;
        max-height: 100%;
    }
}
</style>