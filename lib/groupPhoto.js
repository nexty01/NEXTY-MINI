/**
 * groupPhoto.js — Fetch a WhatsApp group photo at the highest possible
 * resolution and normalise it into a clean JPEG that renders sharply inside
 * `groupInviteMessage.jpegThumbnail` and `externalAdReply.thumbnail`.
 *
 * Why this exists:
 *   - `sock.profilePictureUrl(jid, 'image')` returns the HD photo URL.
 *   - `sock.profilePictureUrl(jid, 'preview')` returns the low-res thumb.
 *   - WhatsApp invite cards render `jpegThumbnail` INLINE on the recipient
 *     device — they never re-fetch a sharper copy. So we MUST embed a real
 *     JPEG that already looks crisp.
 *   - We re-encode through sharp to 640x640 cover-crop JPEG q90 mozjpeg, plus
 *     a full 1080-wide JPEG for the URL preview path.
 */
'use strict';

const sharp = require('sharp');

const HEADERS = {
    'User-Agent': 'WhatsApp/2.23.20.0 A',
    'Accept': 'image/*,*/*;q=0.8',
};

async function fetchBuffer(url) {
    try {
        const res = await fetch(url, { headers: HEADERS });
        if (!res.ok) return null;
        const buf = Buffer.from(await res.arrayBuffer());
        return buf.length > 500 ? buf : null;
    } catch {
        return null;
    }
}

/**
 * Get a group/user profile photo as a raw buffer at the best res available.
 */
async function getRawProfilePhoto(sock, jid) {
    // Try HD first ('image'), then low-res ('preview').
    for (const type of ['image', 'preview']) {
        try {
            const url = await sock.profilePictureUrl(jid, type);
            if (!url) continue;
            const buf = await fetchBuffer(url);
            if (buf) return buf;
        } catch { /* try next tier */ }
    }
    return null;
}

/**
 * Normalise a raw image buffer into the two flavours we need:
 *   - thumbnail: 640x640 JPEG q90 mozjpeg, used as jpegThumbnail.
 *   - full:     up to 1080px wide JPEG q88, used as previewImage/image.
 *
 * Either may be null on failure; the caller falls back gracefully.
 */
async function normalise(buf) {
    if (!buf) return { thumbnail: null, full: null };
    let thumbnail = null;
    let full = null;
    try {
        thumbnail = await sharp(buf)
            .rotate()
            .resize(640, 640, { fit: 'cover', position: 'attention' })
            .jpeg({ quality: 90, mozjpeg: true, progressive: true })
            .toBuffer();
    } catch (e) {
        // If sharp can't decode, fall back to the raw bytes (may still render).
        thumbnail = buf;
    }
    try {
        full = await sharp(buf)
            .rotate()
            .resize({ width: 1080, withoutEnlargement: true })
            .jpeg({ quality: 88, mozjpeg: true, progressive: true })
            .toBuffer();
    } catch {
        full = thumbnail;
    }
    return { thumbnail, full };
}

/**
 * Convenience: get a normalised { thumbnail, full } for a WhatsApp JID.
 */
async function getGroupPhotoBuffers(sock, jid) {
    const raw = await getRawProfilePhoto(sock, jid);
    return normalise(raw);
}

/**
 * Normalise an arbitrary remote image (e.g. og:image) the same way so link
 * previews in status posts look sharp, not blurry.
 */
async function normaliseRemoteImage(url) {
    const raw = await fetchBuffer(url);
    return normalise(raw);
}

/**
 * Normalise an already-downloaded buffer (for callers that fetched themselves).
 */
async function normaliseBuffer(buf) {
    return normalise(buf);
}

module.exports = {
    getRawProfilePhoto,
    getGroupPhotoBuffers,
    normaliseRemoteImage,
    normaliseBuffer,
};
