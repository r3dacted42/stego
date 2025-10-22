<script setup lang="ts">
import { ref } from 'vue';
import ImageDropZone from './ImageDropZone.vue';

const imageFile = ref<File>();

const handleImageDropped = (img: File) => {
    imageFile.value = img;
    console.log(img);
}
</script>

<template>
    <p>encode image with hidden data</p>
    <ImageDropZone v-on:image-dropped="handleImageDropped" />
</template>

<style scoped></style>