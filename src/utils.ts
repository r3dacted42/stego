export function getNamedB64(b64: string, filename: string) {
    const splitIdx = b64.indexOf(';');
    const mimePart = b64.substring(0, splitIdx);
    const dataPart = b64.substring(splitIdx + 1);
    return `${mimePart};name=${encodeURIComponent(filename)};${dataPart}`;
}

export async function getUrlAndNameFromB64(b64: string) {
    const b64Parts = b64.split(';');
    var filename = "secret";
    for (const part of b64Parts) {
        if (part.startsWith('name=')) {
            filename = decodeURIComponent(part.substring(5));
            break;
        }
    }
    const res = await fetch(b64);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return { filename, url };
}

export function copyToClipboard(content?: string) {
    if (content) navigator.clipboard.writeText(content);
}
