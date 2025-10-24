import { MESSAGE_LENGTH_HEADER_BYTES, ZW_CHARS } from "./constants";
import type { TxtDecProcReq, TxtDecProcRes } from "./types";

declare const self: DedicatedWorkerGlobalScope;

self.onmessage = (event: MessageEvent<TxtDecProcReq>) => {
    try {
        const { encTxt } = event.data;

        let encPayload = "";
        for (const ch of encTxt) {
            if (ZW_CHARS.includes(ch)) {
                encPayload += ch;
            }
        }

        const payloadChars = encPayload.length;
        // 1 byte = 4 ZW chars (4 pairs of 2 bits).
        const headerChars = MESSAGE_LENGTH_HEADER_BYTES * 4; // 16 ZW chars

        if (payloadChars < headerChars) {
            throw new Error("No message found or data is corrupted (header missing).");
        }

        const totalBytes = Math.floor(payloadChars / 4);
        const payloadBytes = new Uint8Array(totalBytes);
        let byteIndex = 0;

        for (let i = 0; i < payloadChars; i += 4) {
            const zwChunk = encPayload.substring(i, i + 4);
            if (zwChunk.length < 4) break;

            // (pair3 << 6) | (pair2 << 4) | (pair1 << 2) | pair0
            const pair0 = ZW_CHARS.indexOf(zwChunk[0]!); // bits [1, 0]
            const pair1 = ZW_CHARS.indexOf(zwChunk[1]!); // bits [3, 2]
            const pair2 = ZW_CHARS.indexOf(zwChunk[2]!); // bits [5, 4]
            const pair3 = ZW_CHARS.indexOf(zwChunk[3]!); // bits [7, 6]

            if (pair0 === -1 || pair1 === -1 || pair2 === -1 || pair3 === -1) {
                throw new Error(`Corrupted data: Invalid ZW char detected at chunk ${byteIndex}.`);
            }

            const byte = (pair3 << 6) | (pair2 << 4) | (pair1 << 2) | pair0;
            payloadBytes[byteIndex] = byte;
            byteIndex++;
        }

        const header = payloadBytes.subarray(0, MESSAGE_LENGTH_HEADER_BYTES);
        const dataView = new DataView(header.buffer);
        const messageLength = dataView.getUint32(0, false); // false = big-endian

        const expectedBodyBytes = messageLength;
        const actualBodyBytes = payloadBytes.length - MESSAGE_LENGTH_HEADER_BYTES;

        if (expectedBodyBytes > actualBodyBytes) {
            throw new Error(`Corrupted data: Header indicates ${expectedBodyBytes} bytes, but only ${actualBodyBytes} were found.`);
        }

        const messageBytes = payloadBytes.subarray(
            MESSAGE_LENGTH_HEADER_BYTES,
            MESSAGE_LENGTH_HEADER_BYTES + messageLength
        );

        const textDecoder = new TextDecoder();
        const message = textDecoder.decode(messageBytes);

        const response: TxtDecProcRes = { message };
        self.postMessage(response);

    } catch (e) {
        const error = e as Error;
        self.postMessage({ error: error.message } as TxtDecProcRes);
    }
}

export default {};
