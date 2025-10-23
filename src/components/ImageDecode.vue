<script setup lang="ts">
import { ref } from 'vue';
import ImageDropZone from './ImageDropZone.vue';
import imgDecProcWorker from '../workers/imgDecProc.worker.ts?worker';
import type { ImgDecProcReq, ImgDecProcRes } from '../workers/types';

const imageFile = ref<File>();
const message = ref('');
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
</template>