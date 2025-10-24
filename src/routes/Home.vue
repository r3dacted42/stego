<template>
    <h2>advanced cybersecurity [CSE866] project</h2>
    <h2>what is Steganography?</h2>
    <p>
        steganography is the art and science of hiding a message, file, or other data within another message,
        file, or object, without anyone else knowing that the hidden data exists. unlike cryptography, which
        just scrambles a message, steganography conceals its very existence.
    </p>
    <p>
        this project demonstrates two of the most common methods used on the web. use the nav links above to try them
        out!
    </p>

    <hr>

    <h3>image steganography (LSB)</h3>
    <p>
        this method hides data inside the pixels of an image. every pixel on your screen is made of Red, Green, and Blue
        (RGB) color channels. each channel has a value from 0 to 255.
    </p>
    <p>
        the Least Significant Bit (LSB) technique changes the very last bit of each channel's value. for example, a Red
        value of <code>150</code> (binary <code>10010110</code>) might be changed to <code>151</code> (binary
        <code>10010111</code>). this change is so tiny that it's completely invisible to the human eye, but it allows us
        to store 1 bit of data.
    </p>
    <p>
        this tool stores 3 bits in every pixel (one for Red, Green, and Blue), allowing us to hide surprisingly large
        messages or even entire files inside an ordinary-looking picture.
    </p>

    <h3>text steganography (zero-width Unicode)</h3>
    <p>
        this method hides data by inserting invisible characters between the visible letters of a text. Unicode, the
        standard for text on computers, includes "zero-width" characters that take up no space and are not rendered.
    </p>
    <p>
        we use four different zero-width characters to represent 2 bits of data at a time (e.g., <code>U+200B</code> =
        <code>00</code>, <code>U+200C</code> = <code>01</code>, etc.). these invisible characters are interleaved
        throughout the carrier text, so a sentence like "Hello world" might actually look like this to a computer:
    </p>
    <p><code>H[zw]e[zw]l[zw]l[zw]o[zw] [zw]w[zw]o[zw]r[zw]l[zw]d</code></p>
    <p>the result can be copied and pasted just like normal text, carrying its secret message with it.</p>

    <hr>

    <h3>limitations & considerations</h3>
    <p>
        while powerful, these techniques are very fragile and are intended for educational purposes, not for secure
        communication. keep these limitations in mind:
    </p>
    <ul>
        <li><strong>image compression destroys data:</strong> the LSB method only works with lossless formats like
            <code>PNG</code>. saving an encoded image as a <code>JPEG</code> will compress the image, change all the
            pixel values, and completely destroy the hidden message.
        </li>
        <li><strong>zero-width characters are often stripped:</strong> many websites, social media platforms, and text
            editors will "clean" text by removing unrecognized characters, including zero-width spaces. pasting your
            encoded text into one of these applications will likely erase the hidden message.</li>
        <li><strong>file encoding is inefficient:</strong> hiding a file (like an image) inside text is possible, but
            extremely inefficient. the file is converted to text (Base64), and each character of that text is encoded
            using multiple zero-width characters. this can cause the text's data size to explode, making it
            suspicious or outright too big to handle.</li>
        <li><strong>language interference:</strong> the zero-width characters used might conflict with languages (like
            arabic or some indic scripts) that use them for their correct grammatical structure. this can lead to
            corrupted data when decoding.</li>
    </ul>
</template>
