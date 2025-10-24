<script setup lang="ts">
import TextDecode from '../components/TextDecode.vue';
import TextEncode from '../components/TextEncode.vue';


defineProps({
    encode: Boolean,
});
</script>

<template>
    <h2>text steganography</h2>

    <TextEncode v-if="encode" />

    <TextDecode v-else />
</template>
