import { MESSAGE_LENGTH_HEADER_BYTES } from "./constants";
import type { ImgDecProcReq, ImgDecProcRes } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<ImgDecProcReq>) => {
    try {
        console.log('Worker received bitmap for decoding');
        const { bitmap } = event.data;

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            self.postMessage({ error: 'Failed to get OffscreenCanvas context' } as ImgDecProcRes);
            return;
        }

        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data; // [R,G,B,A, ...]
        
        const totalPixels = Math.floor(data.length / 4);
        const totalAvailableBits = totalPixels * 3;
        if (totalAvailableBits < MESSAGE_LENGTH_HEADER_BYTES * 8) {
            self.postMessage({ error: 'Image is too small to contain a message header.' } as ImgDecProcRes);
            return;
        }

        const headerBytes = new Uint8Array(MESSAGE_LENGTH_HEADER_BYTES);
        let bitIndex = 0;

        for (let i = 0; i < MESSAGE_LENGTH_HEADER_BYTES; i++) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                while (bitIndex % 4 === 3) bitIndex++; // skip alpha channel
                if (bitIndex >= data.length) {
                    throw new Error("unexpected EOF");
                }

                const bit = data[bitIndex]! & 1; // LSB
                byte = (byte << 1) | bit; // shift and add
                
                bitIndex++;
            }
            headerBytes[i] = byte;
        }

        const dataView = new DataView(headerBytes.buffer);
        const messageLength = dataView.getUint32(0, false); // false = big-endian

        const remainingBits = totalAvailableBits - MESSAGE_LENGTH_HEADER_BYTES * 8;
        const requiredBits = messageLength * 8;

        if (messageLength === 0) {
            self.postMessage({ message: "" } as ImgDecProcRes);
            return;
        }

        if (requiredBits > remainingBits) {
            self.postMessage({ error: `Corrupted data: Message length header is ${messageLength} bytes, but only ${Math.floor(remainingBits / 8)} bytes are available.` } as ImgDecProcRes);
            return;
        }

        const messageBytes = new Uint8Array(messageLength);
        for (let i = 0; i < messageLength; i++) {
            let byte = 0;
            for (let j = 0; j < 8; j++) {
                while (bitIndex % 4 === 3) bitIndex++; // skip alpha channel
                if (bitIndex >= data.length) {
                    throw new Error("unexpected EOF");
                }

                const bit = data[bitIndex]! & 1;
                byte = (byte << 1) | bit;

                bitIndex++;
            }
            messageBytes[i] = byte;
        }

        const textDecoder = new TextDecoder();
        const message = textDecoder.decode(messageBytes);

        const response: ImgDecProcRes = { message };
        self.postMessage(response);
    } catch (e) {
        const error = e as Error;
        self.postMessage({ error: error.message } as ImgDecProcRes);
    }
};

export default {};