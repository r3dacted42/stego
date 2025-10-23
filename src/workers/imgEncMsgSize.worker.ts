import { MESSAGE_LENGTH_HEADER_BYTES } from "./constants";
import type { ImgEncMsgSizeReq, ImgEncMsgSizeRes } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<ImgEncMsgSizeReq>) => {
    try {
        console.log('Worker received bitmap for size calculation');
        const { bitmap } = event.data;

        const canvas = new OffscreenCanvas(bitmap.width, bitmap.height);
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            self.postMessage({ error: 'Failed to get OffscreenCanvas context' } as ImgEncMsgSizeRes);
            return;
        }

        ctx.drawImage(bitmap, 0, 0);
        bitmap.close();

        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;
        const totalPixels = Math.floor(data.length / 4);
        const totalAvailableBits = totalPixels * 3; // skip alpha channel
        const totalAvailableBytes = Math.floor(totalAvailableBits / 8);
        const maxMessageSizeInBytes = totalAvailableBytes - MESSAGE_LENGTH_HEADER_BYTES;

        const response: ImgEncMsgSizeRes = { size: maxMessageSizeInBytes };
        self.postMessage(response);
    } catch (e) {
        const error = e as Error;
        self.postMessage({ error: error.message } as ImgEncMsgSizeRes);
    }
};

export default {};