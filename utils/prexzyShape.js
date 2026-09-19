/**
 * prexzyShape.js — defensive response parsing for apis.prexzyvilla.site
 * endpoints whose exact JSON shape could not be confirmed live (every
 * test request returned 400/500 with no visible body during development).
 *
 * These helpers walk the response looking for whatever shape is actually
 * there, following the same convention already used elsewhere in this
 * codebase (commands/ai/generate.js, commands/ai/editimage.js):
 * data.image_url / data.images / data.result / data.url, possibly nested
 * one level inside an array of objects with .image.url or .url.
 *
 * If the real API ever returns something outside these guesses, these
 * functions return null/[] rather than throwing, so callers can fall back
 * cleanly instead of crashing.
 */
'use strict';

const URL_RE = /^https?:\/\//i;
const IMAGE_EXT_RE = /\.(png|jpe?g|webp|gif|bmp)(\?|$)/i;

// Pull every plausible image URL out of an unknown JSON shape.
function extractImageUrls(data, max = 10) {
    const out = [];
    const seen = new Set();

    function push(url) {
        if (typeof url === 'string' && URL_RE.test(url) && !seen.has(url)) {
            seen.add(url);
            out.push(url);
        }
    }

    function walk(node, depth) {
        if (!node || depth > 4 || out.length >= max) return;
        if (typeof node === 'string') {
            if (URL_RE.test(node)) push(node);
            return;
        }
        if (Array.isArray(node)) {
            for (const v of node) walk(v, depth + 1);
            return;
        }
        if (typeof node === 'object') {
            // Prefer known field names first so they sort earlier in `out`.
            for (const key of ['url', 'image_url', 'imageUrl', 'image', 'link', 'src']) {
                if (node[key] != null) walk(node[key], depth + 1);
            }
            for (const v of Object.values(node)) walk(v, depth + 1);
        }
    }

    walk(data, 0);
    // De-prioritize URLs that obviously aren't images if we have better options.
    const withExt = out.filter(u => IMAGE_EXT_RE.test(u));
    return (withExt.length ? withExt : out).slice(0, max);
}

// Pull every plausible audio URL out of an unknown JSON shape.
function extractAudioUrls(data, max = 5) {
    const AUDIO_RE = /\.(mp3|ogg|m4a|wav|aac|opus)(\?|$)/i;
    const out = [];
    function walk(node, depth) {
        if (!node || depth > 4 || out.length >= max) return;
        if (typeof node === 'string') {
            if (URL_RE.test(node) && AUDIO_RE.test(node)) out.push(node);
            return;
        }
        if (Array.isArray(node)) { for (const v of node) walk(v, depth + 1); return; }
        if (typeof node === 'object') { for (const v of Object.values(node)) walk(v, depth + 1); }
    }
    walk(data, 0);
    return out;
}

// Best-effort flatten of a "profile/stalk"-style object into label:value
// pairs for display, since the real field names are unconfirmed. Skips
// nested objects/arrays (handled separately by the caller if needed).
function flattenProfileFields(data) {
    const root = data?.data ?? data?.result ?? data ?? {};
    const fields = {};
    for (const [k, v] of Object.entries(root)) {
        if (v == null) continue;
        if (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') {
            fields[k] = v;
        }
    }
    return fields;
}

module.exports = { extractImageUrls, extractAudioUrls, flattenProfileFields };
