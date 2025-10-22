<script setup lang="ts">
import ImageEncode from '../components/ImageEncode.vue';

defineProps({
    encode: Boolean,
});
</script>

<template>
    <h2>image steganography</h2>
    
    <ImageEncode v-if="encode" />

    <div v-else>
        decode
    </div>
</template>

<style scoped>
</style>