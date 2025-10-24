<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import ImageDropZone from './ImageDropZone.vue';
import imgDecProcWorker from '../workers/imgDecProc.worker.ts?worker';
import type { ImgDecProcReq, ImgDecProcRes } from '../workers/types';
import { getUrlAndNameFromB64 } from '../utils';

const imageFile = ref<File>();
const message = ref('');
const fileAnchor = ref<{ href: string, name: string }>();
const isDecoding = ref(false);
const errorMsg = ref('');
const dialogRef = useTemplateRef("err-dialog");

const handleImageDropped = (img: File) => {
    imageFile.value = img;
};

const decWorker = new imgDecProcWorker();
decWorker.onmessage = (ev: MessageEvent<ImgDecProcRes>) => {
    isDecoding.value = false;
    const { message: msg, error } = ev.data;
    errorMsg.value = error ?? "";
    if (error && dialogRef.value) dialogRef.value.showModal();
    if (!msg) return;
    message.value = msg;
}
decWorker.onerror = (e) => {
    console.error("error in decWorker: ", e);
}
const decodeImage = async () => {
    if (!imageFile.value) return;
    try {
        isDecoding.value = true;
        const bitmap = await createImageBitmap(imageFile.value);
        const req: ImgDecProcReq = { bitmap };
        decWorker.postMessage(req, [bitmap]);
    } catch (error) {
        isDecoding.value = false;
        errorMsg.value = `failed to create ImageBitmap: ${error}`;
        if (error && dialogRef.value) dialogRef.value.showModal();
    }
}

watch(message, async (newMessage) => {
    if (!newMessage.startsWith('data:')) return;
    try {
        if (fileAnchor.value?.href) URL.revokeObjectURL(fileAnchor.value.href);
        const { url, filename } = await getUrlAndNameFromB64(newMessage);
        fileAnchor.value = {
            href: url,
            name: filename,
        };
    } catch (e) {
        console.warn("couldn't convert message to file: ", e);
    }
});

onBeforeUnmount(() => {
    decWorker.terminate();
    if (fileAnchor.value?.href) URL.revokeObjectURL(fileAnchor.value.href);
});
</script>

<template>
    <h3>decode</h3>
    <p>select an image containing encoded data</p>
    <ImageDropZone v-on:image-dropped="handleImageDropped" :disabled="isDecoding" />
    <p></p>
    <button type="button" @click="decodeImage" :disabled="!imageFile || isDecoding">
        decode
    </button>
    <p></p>
    <textarea v-model="message" rows="5" placeholder="decoded message..." readonly></textarea>
    <div class="full-width" style="display: flex; place-content: end;">
        <a :href="fileAnchor?.href" :aria-disabled="!fileAnchor" :download="fileAnchor?.name">save as file...</a>
    </div>

    <dialog ref="err-dialog" closedby="none">
        error: {{ errorMsg }} <br />
        <button type="button" @click="dialogRef?.close()">okay</button>
    </dialog>
</template>