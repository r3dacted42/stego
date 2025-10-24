<script setup lang="ts">
import { computed, onBeforeUnmount, ref, useTemplateRef } from 'vue';
import txtEncProcWorker from '../workers/txtEncProc.worker.ts?worker';
import type { TxtEncProcReq, TxtEncProcRes } from '../workers/types';
import { getNamedB64 } from '../utils';

const carrierTxt = ref('');
const secretType = ref<'text' | 'file'>('text');
const secretTxt = ref('');
const isEncoding = ref(false);
const encodedTxt = ref('');
const errorMsg = ref('');
const dialogRef = useTemplateRef("err-dialog");

const canChangePayload = computed(() => {
    return (!carrierTxt.value || isEncoding.value);
})

const handlePayloadFileChange = (ev: Event) => {
    const tgt = ev.target as HTMLInputElement;
    const file = tgt.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
        const b64 = reader.result as string;
        secretTxt.value = getNamedB64(b64, file.name);
    };
}

const encWorker = new txtEncProcWorker();
encWorker.onmessage = (ev: MessageEvent<TxtEncProcRes>) => {
    isEncoding.value = false;
    const { encTxt, error } = ev.data;
    errorMsg.value = error ?? "";
    if (error && dialogRef.value) dialogRef.value.showModal();
    if (!encTxt) return;
    encodedTxt.value = encTxt;
}
encWorker.onerror = (e) => {
    isEncoding.value = false;
    console.error("error in encWorker: ", e);
};
const encodeText = () => {
    if (!carrierTxt.value || !secretTxt.value) return;
    try {
        isEncoding.value = true;
        const req: TxtEncProcReq = { carrier: carrierTxt.value, message: secretTxt.value };
        encWorker.postMessage(req);
    } catch (error) {
        isEncoding.value = false;
        errorMsg.value = `failed to encode: ${error}`;
        if (error && dialogRef.value) dialogRef.value.showModal();
    }
};

const copyToClipboard = () => {
    navigator.clipboard.writeText(encodedTxt.value);
}

onBeforeUnmount(() => {
    encWorker.terminate();
});
</script>

<template>
    <h3>encode</h3>
    <p>enter carrier text</p>
    <textarea v-model="carrierTxt" rows="5" placeholder="carrier text here..."></textarea>

    <p>payload</p>
    <span class="secret-type">
        <label>
            <input type="radio" v-model="secretType" name="secretType" value="text" :disabled="canChangePayload" />
            text
        </label>
        <label>
            <input type="radio" v-model="secretType" name="secretType" value="file" :disabled="canChangePayload" />
            file
        </label>
    </span>
    <textarea v-if="secretType === 'text'" :disabled="canChangePayload" v-model="secretTxt" rows="5" id="secret"
        placeholder="super secret message..."></textarea>
    <input v-if="secretType === 'file'" @change="handlePayloadFileChange" type="file" :disabled="canChangePayload" />
    <p></p>
    <button type="button" :disabled="isEncoding" @click="encodeText">
        {{ isEncoding ? "encoding..." : "encode" }}
    </button>

    <label @click="copyToClipboard" title="click to copy">
        <textarea v-model="encodedTxt" rows="5" placeholder="encoded text" readonly></textarea>
        <small style="width: 100%; text-align: end;">click to copy encoded text</small>
    </label>

    <dialog ref="err-dialog" closedby="none">
        error: {{ errorMsg }} <br />
        <button type="button" @click="dialogRef?.close()">okay</button>
    </dialog>
</template>

<style scoped>
.secret-type {
    margin-top: -1em;
    margin-bottom: 1em;
    display: flex;
    flex-direction: row;
    gap: 1em;
}
</style>