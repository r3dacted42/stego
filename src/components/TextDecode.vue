<script setup lang="ts">
import { onBeforeUnmount, ref, watch } from 'vue';
import txtDecProcWorker from '../workers/txtDecProc.worker.ts?worker';
import type { TxtDecProcReq, TxtDecProcRes } from '../workers/types';

const encodedTxt = ref('');
const isDecoding = ref(false);
const fileAnchor = ref<{ href: string, name: string }>();
const message = ref('');

const decWorker = new txtDecProcWorker();
decWorker.onmessage = (ev: MessageEvent<TxtDecProcRes>) => {
    isDecoding.value = false;
    const { message: msg } = ev.data;
    if (!msg) return;
    message.value = msg;
}
decWorker.onerror = (e) => {
    console.error("error in decWorker: ", e);
}
const decodeText = () => {
    if (!encodedTxt.value) return;
    try {
        isDecoding.value = true;
        const req: TxtDecProcReq = { encTxt: encodedTxt.value };
        decWorker.postMessage(req);
    } catch (error) {
        isDecoding.value = false;
        console.error('Failed to decode:', error);
    }
};

watch(message, async (newMessage) => {
    if (!newMessage.startsWith('data:')) return;
    try {
        if (fileAnchor.value?.href) URL.revokeObjectURL(fileAnchor.value.href);
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

onBeforeUnmount(() => {
    decWorker.terminate();
    if (fileAnchor.value?.href) URL.revokeObjectURL(fileAnchor.value.href);
});
</script>

<template>
    <h3>decode</h3>
    <p>enter text containing encoded data</p>
    <textarea v-model="encodedTxt" rows="5" placeholder="encoded text here..."></textarea>
    <p></p>
    <button type="button" @click="decodeText" :disabled="!encodedTxt || isDecoding">
        decode
    </button>
    <p></p>
    <textarea v-model="message" rows="5" placeholder="decoded message..." readonly></textarea>
    <div class="full-width" style="display: flex; place-content: end;">
        <a :href="fileAnchor?.href" :aria-disabled="!fileAnchor" :download="fileAnchor?.name">save as file...</a>
    </div>
</template>