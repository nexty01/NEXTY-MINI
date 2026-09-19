'use strict';

const WebP = require('node-webpmux');

function buildExif(packname, author, emojis) {
    const metadata = JSON.stringify({
        'sticker-pack-id': 'com.nexty.mini',
        'sticker-pack-name': String(packname || 'NEXTY MINI'),
        'sticker-pack-publisher': String(author || 'NEXTY'),
        emojis: Array.isArray(emojis) ? emojis : [],
    });
    const payload = Buffer.from(metadata, 'utf8');
    // Minimal TIFF/EXIF header followed by the WhatsApp sticker metadata JSON.
    const header = Buffer.from([
        0x49, 0x49, 0x2A, 0x00,
        0x08, 0x00, 0x00, 0x00,
        0x01, 0x00,
        0x41, 0x57, 0x07, 0x00,
        0x00, 0x00, 0x00, 0x00,
        0x16, 0x00, 0x00, 0x00,
        0x00, 0x00, 0x00, 0x00,
    ]);
    header.writeUInt32LE(payload.length, 14);
    return Buffer.concat([header, payload]);
}

async function addExif(input, packname, author, emojis = []) {
    if (!Buffer.isBuffer(input) || input.length === 0) {
        throw new TypeError('addExif expects a non-empty WebP Buffer');
    }
    const image = new WebP.Image();
    await image.load(input);
    image.exif = buildExif(packname, author, emojis);
    return image.save(null);
}

module.exports = { addExif, buildExif };
