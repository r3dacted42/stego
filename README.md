# stego

adv cysec project on steganography  
stego is a web-based steganography tool that allows you to hide secret messages and files within images or plain text. this project explores modern steganographic techniques, performing all heavy processing directly in your browser using Web Workers to ensure your data stays private and the application remains fast and responsive.  

![badge](https://github.com/r3dacted42/stego/workflows/deploy/badge.svg) [deployment](https://r3dacted42.github.io/stego/)  

**project #7**  

> Text Steganography – Hide secret messages inside text or image files and retrieve them manually.  
  Goal: Explore how hidden communication can be achieved through steganography.  
  End Goal: Provide original and modified files, along with scripts and screenshots showing hidden message extraction.  

## features

this application provides two main types of steganography:

- image steganography (LSB)
    - encode: hide a text message or a file (of any type) inside a carrier image. the tool calculates the maximum possible message size based on the image's dimensions.
    - decode: extract the hidden message or file from an encoded image. if a file is detected, it provides a download link with the original filename.

- text steganography (zero-width Unicode)
    - encode: embed a secret message or file within a "carrier" text. the output text looks identical to the original but contains hidden zero-width (ZW) characters.
    - decode: extract the hidden message or file by filtering out the invisible ZW characters from the carrier text.

## how it works

### image steganography: LSB Encoding

this tool uses the Least Significant Bit (LSB) method, which is a classic steganographic technique.

- 3-bits per pixel: it modifies the last bit of the Red, Green, and Blue channels of each pixel to store data. we use 3 bits per pixel (not 4) because modifying the Alpha (transparency) channel can cause data corruption when the browser saves the file as a PNG (due to premultiplied alpha).
- length header: the first 32 bits (11 pixels) of the image are used to store a 4-byte header that indicates the total length of the hidden message. this tells the decoder exactly when to stop reading.
- Web Workers: all pixel manipulation (reading and writing) is done in a background Web Worker to prevent the browser UI from freezing on large images.

### text steganography: Zero-Width Unicode Characters

this method hides data by interleaving invisible characters between the visible characters of a carrier text.

- quaternary (2-bit) encoding: we use four distinct zero-width characters to represent 2 bits of data at a time (`00`, `01`, `10`, `11`). this is twice as space-efficient as using only two characters for `0` and `1`.
    - `U+200B` (Zero Width Space)
    - `U+200D` (Zero Width Joiner)
    - `U+200C` (Zero Width Non-Joiner)
    - `U+FEFF` (Zero Width No-Break Space)
- length header: just like the image method, the first 16 ZW characters (16 chars * 2 bits/char = 32 bits) are used to store a 4-byte header indicating the message length.
- interleaving: the ZW characters are distributed evenly between the letters of the carrier text, making them harder to detect than if they were all appended at the end.

## limitations & considerations

steganography is powerful, but these methods have critical weaknesses:

- image compression: the LSB method is extremely fragile. saving the encoded image as a `JPEG` or any other lossy format will corrupt the data. the data can only be recovered if the image is saved in a lossless format (like `PNG`).
- ZW character stripping: the text method is vulnerable to "sanitization." many web apps, social media sites, and text editors will automatically strip unknown or zero-width characters from text. pasting your encoded message into such an app will instantly destroy the hidden data.
- file size explosion: hiding a file inside text is very inefficient. a file is converted to a Base64 string, and then each byte of that string requires 4 ZW characters. a small 100kb file can result in a massive, multi-megabyte block of text that is highly suspicious.
- language interference: using ZW Joiners/Non-Joiners (`U+200C`, `U+200D`) can theoretically cause rendering issues in languages (like Arabic or Devanagari) that actually use these characters for linguistic purposes. this implementation is safest for English and other simple scripts.
- easy detection: while invisible to the naked eye, these methods are trivial to detect with scripts that check for ZW characters or analyze LSB data. this tool is for educational purposes, not for secure communication.

## how to run locally

this is a standard Vue 3 + Vite project.

- clone the repository:
    ```bash
    git clone [https://github.com/r3dacted42/stego.git](https://github.com/r3dacted42/stego.git)
    cd stego
    ```
- install dependencies:
    ```bash
    npm install
    ```
- run the development server:
    ```bash
    npm run dev
    ```
- open: http://localhost:5173 in your browser.
