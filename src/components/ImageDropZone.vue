<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, useTemplateRef } from 'vue';

const { onImageDropped } = defineProps<{
    onImageDropped: (img: File) => void,
}>();

const dropZone = useTemplateRef("dropZone");
const fileInput = useTemplateRef<HTMLInputElement>("fileInput");
const imageFile = ref<File>();
const imageSrc = computed(() => {
    if (!imageFile.value) return "";
    return URL.createObjectURL(imageFile.value);
});

const handlers = {
    window: {
        handleDrop: (e: DragEvent) => {
            if (e.dataTransfer && [...e.dataTransfer.items].some((item) => item.kind === "file")) {
                e.preventDefault();
            }
        },
        handleDragOver: (e: DragEvent) => {
            if (!e.dataTransfer) return;
            const fileItems = [...e.dataTransfer.items].filter(
                (item) => item.kind === "file",
            );
            if (fileItems.length > 0) {
                e.preventDefault();
            }
        }
    },
    dropZone: {
        handleDrop: (ev: DragEvent) => {
            ev.preventDefault();
            if (!ev.dataTransfer) return;
            const files = [...ev.dataTransfer.items]
                .map((item) => item.getAsFile())
                .filter((file) => file);
            if (files.length > 0 && files[0]) {
                onImageDropped(files[0]);
                imageFile.value = files[0];
            }
        },
        handleDragOver: (e: DragEvent) => {
            if (!e.dataTransfer) return;
            const fileItems = [...e.dataTransfer.items].filter(
                (item) => item.kind === "file",
            );
            if (fileItems.length > 0) {
                e.preventDefault();
                if (fileItems.some((item) => item.type.startsWith("image/"))) {
                    e.dataTransfer.dropEffect = "copy";
                } else {
                    e.dataTransfer.dropEffect = "none";
                }
            }
        },
    },
    fileInput: {
        handleChange: (ev: Event) => {
            if (!ev.target) return;
            const elem = ev.target as HTMLInputElement;
            if (elem.files && elem.files.length > 0 && elem.files[0]) {
                onImageDropped(elem.files[0]);
                imageFile.value = elem.files[0];
            }
        },
    },
};

onMounted(() => {
    dropZone.value?.addEventListener("drop", handlers.dropZone.handleDrop);
    dropZone.value?.addEventListener("dragover", handlers.dropZone.handleDragOver);
    window.addEventListener("drop", handlers.window.handleDrop);
    window.addEventListener("dragover", handlers.window.handleDragOver);
    fileInput.value?.addEventListener("change", handlers.fileInput.handleChange);
});

onUnmounted(() => {
    dropZone.value?.removeEventListener("drop", handlers.dropZone.handleDrop);
    dropZone.value?.removeEventListener("dragover", handlers.dropZone.handleDragOver);
    window.removeEventListener("drop", handlers.window.handleDrop);
    window.removeEventListener("dragover", handlers.window.handleDragOver);
    fileInput.value?.removeEventListener("change", handlers.fileInput.handleChange);
});
</script>

<template>
    <label ref="dropZone" class="border drop-zone">
        <span v-if="!imageFile">drop image or click to upload</span>
        <img v-else class="img-preview" :src="imageSrc" />
        <input ref="fileInput" type="file" id="img-input" accept="image/*" />
    </label>
</template>

<style scoped>
.drop-zone {
    place-content: center;
    height: fit-content;
    min-height: 12em;
    cursor: pointer;
    border-style: dashed;
    padding: var(--border-radius);

    input {
        display: none;
    }
}

.img-preview {
    flex-grow: 1;
    max-height: 100%;
}
</style>