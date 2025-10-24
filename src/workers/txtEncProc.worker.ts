import { MESSAGE_LENGTH_HEADER_BYTES, ZW_CHARS } from "./constants";
import type { TxtEncProcReq, TxtEncProcRes } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<TxtEncProcReq>) => {
    const { carrier, message } = event.data;

    const textEncoder = new TextEncoder();
    const messageBytes = textEncoder.encode(message);
    const messageLength = messageBytes.length;

    const headerBytes = new Uint8Array(MESSAGE_LENGTH_HEADER_BYTES);
    const dataView = new DataView(headerBytes.buffer);
    dataView.setUint32(0, messageLength, false); // false = big-endian

    const payloadBytes = new Uint8Array(headerBytes.length + messageBytes.length);
    payloadBytes.set(headerBytes, 0);
    payloadBytes.set(messageBytes, headerBytes.length);

    let encPayload = "";
    for (let i = 0; i < payloadBytes.length; i++) {
        const payloadByte = payloadBytes[i];
        let bitPairIdx = 0;
        for (let mask = 0b11; mask >> 8 === 0; mask <<= 2, bitPairIdx++) {
            const bitPair = (payloadByte! & mask) >> (bitPairIdx * 2);
            encPayload += ZW_CHARS[bitPair];
        }
    }

    const encPayloadLength = encPayload.length;
    const carrierLength = carrier.length;
    const partLength = Math.ceil(encPayloadLength / (carrierLength - 1));

    let encTxt = "";
    for (let i = 0; i < carrierLength; i++) {
        encTxt += carrier[i];
        encTxt += encPayload.substring(i * partLength, (i + 1) * partLength);
    }

    const response: TxtEncProcRes = { encTxt };
    self.postMessage(response);
}

export default {};