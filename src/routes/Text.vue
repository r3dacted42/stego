<script setup lang="ts">

defineProps({
    encode: Boolean,
});
</script>

<template>
    <h2>text steganography</h2>
    
    <div v-if="encode">
        encode
    </div>

    <div v-else>
        decode
    </div>
</template>

<style scoped>
</style>