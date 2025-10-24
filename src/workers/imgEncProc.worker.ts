import { MESSAGE_LENGTH_HEADER_BYTES } from "./constants";
import type { ImgEncProcReq, ImgEncProcRes } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<ImgEncProcReq>) => {
    try {
        const { bitmap, message } = event.data;

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            self.postMessage({ error: 'Failed to get OffscreenCanvas context' } as ImgEncProcRes);
            return;
        }

        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data; // [R,G,B,A, R,G,B,A, ...]

        const textEncoder = new TextEncoder();
        const messageBytes = textEncoder.encode(message);
        const messageLength = messageBytes.length;

        const headerBytes = new Uint8Array(MESSAGE_LENGTH_HEADER_BYTES);
        const dataView = new DataView(headerBytes.buffer);
        dataView.setUint32(0, messageLength, false); // false = big-endian

        const payloadBytes = new Uint8Array(headerBytes.length + messageBytes.length);
        payloadBytes.set(headerBytes, 0);
        payloadBytes.set(messageBytes, headerBytes.length);

        const totalPayloadBits = payloadBytes.length * 8;
        const totalPixels = Math.floor(data.length / 4);
        const totalAvailableBits = totalPixels * 3; // skip alpha channel

        if (totalPayloadBits > totalAvailableBits) {
            self.postMessage({ error: `Message is too large (${messageLength} bytes) for this image (max ${Math.floor(totalAvailableBits / 8) - MESSAGE_LENGTH_HEADER_BYTES} bytes).` } as ImgEncProcRes);
            return;
        }

        let dataIndex = 0;

        for (let i = 0; i < payloadBytes.length; i++) {
            const payloadByte = payloadBytes[i];
            for (let j = 7; j >= 0; j--) {
                while (dataIndex % 4 === 3) dataIndex++; // skip alpha channel
                if (dataIndex >= data.length) {
                    throw new Error("unexpected EOF");
                }

                const bit = (payloadByte! >> j) & 1;
                const originalChannelValue = data[dataIndex];
                if (bit === 1) {
                    data[dataIndex] = originalChannelValue! | 1; // set LSB = 1
                } else {
                    data[dataIndex] = originalChannelValue! & 0xFE; // 0xFE is 11111110
                }

                dataIndex++;
            }
        }

        const response: ImgEncProcRes = { imageData };
        self.postMessage(response, [imageData.data.buffer]);
    } catch (e) {
        const error = e as Error;
        self.postMessage({ error: error.message } as ImgEncProcRes);
    }
};

export default {};