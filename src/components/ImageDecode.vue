<script setup lang="ts">
import { ref, watch } from 'vue';
import ImageDropZone from './ImageDropZone.vue';
import imgDecProcWorker from '../workers/imgDecProc.worker.ts?worker';
import type { ImgDecProcReq, ImgDecProcRes } from '../workers/types';

const imageFile = ref<File>();
const message = ref('');
const fileAnchor = ref<{href: string, name: string}>();
const isDecoding = ref(false);

const handleImageDropped = (img: File) => {
    imageFile.value = img;
};

const decWorker = new imgDecProcWorker();
decWorker.onmessage = (ev: MessageEvent<ImgDecProcRes>) => {
    isDecoding.value = false;
    const { message : msg } = ev.data;
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
        console.error('Failed to create ImageBitmap:', error);
    }

}

watch(message, async (newMessage) => {
    if (!newMessage.startsWith('data:')) return;
    try {
        const b64Parts = newMessage.split(';');
        var filename = "secret";
        for (const part of b64Parts) {
            if (part.startsWith('name=')) {
                filename = decodeURIComponent(part.substring(5));
                break;
            }
        }
        const res = await fetch(newMessage);
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        fileAnchor.value = {
            href: url,
            name: filename,
        };
    } catch (e) {
        console.warn("couldn't convert message to file: ", e);
    }
});
</script>

<template>
    <h3>decode</h3>
    <p>select an image containing encoded data</p>
    <ImageDropZone v-on:image-dropped="handleImageDropped" :disabled="isDecoding" />
    <p></p>
    <div class="full-width" style="display: flex; place-content: center;">
        <button type="button" @click="decodeImage" :disabled="!imageFile || isDecoding">
            decode
        </button>
    </div>
    <p></p>
    <textarea v-model="message" rows="5" placeholder="decoded message..." readonly></textarea>
    <div class="full-width" style="display: flex; place-content: end;">
        <a :href="fileAnchor?.href" :aria-disabled="!fileAnchor" :download="fileAnchor?.name">save as file...</a>
    </div>
</template>