<script setup lang="ts">
import ImageDecode from '../components/ImageDecode.vue';
import ImageEncode from '../components/ImageEncode.vue';

defineProps({
    encode: Boolean,
});
</script>

<template>
    <h2>image steganography</h2>

    <ImageEncode v-if="encode" />

    <ImageDecode v-else />
</template>
