<script setup lang="ts">
import { onBeforeUnmount, ref, useTemplateRef, watch } from 'vue';
import txtDecProcWorker from '../workers/txtDecProc.worker.ts?worker';
import type { TxtDecProcReq, TxtDecProcRes } from '../workers/types';
import { getUrlAndNameFromB64 } from '../utils';

const encodedTxt = ref('');
const isDecoding = ref(false);
const fileAnchor = ref<{ href: string, name: string }>();
const message = ref('');
const errorMsg = ref('');
const dialogRef = useTemplateRef("err-dialog");

const decWorker = new txtDecProcWorker();
decWorker.onmessage = (ev: MessageEvent<TxtDecProcRes>) => {
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
const decodeText = () => {
    if (!encodedTxt.value) return;
    try {
        isDecoding.value = true;
        const req: TxtDecProcReq = { encTxt: encodedTxt.value };
        decWorker.postMessage(req);
    } catch (error) {
        isDecoding.value = false;
        errorMsg.value = `failed to decode: ${error}`;
        if (error && dialogRef.value) dialogRef.value.showModal();
    }
};

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
    <p>enter text containing encoded data</p>
    <textarea v-model="encodedTxt" rows="5" placeholder="encoded text here..."></textarea>
    <p></p>
    <button type="button" @click="decodeText" :disabled="!encodedTxt || isDecoding">
        {{ isDecoding ? "decoding..." : "decode" }}
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