/**
 * mediaFetch — shared helper for prexzyvilla general-purpose media endpoints
 * (profile pics, tiktok clips, etc). Calls an endpoint and walks the JSON
 * response to pull out any usable image/video URL(s).
 *
 * NOTE: many free media APIs return signed/hashed CDN links with NO file
 * extension (e.g. https://cdn.example.com/f/8f2a91c), so we can't rely on
 * extension-matching alone — that was the likely cause of "no media found"
 * errors. We now accept ANY http(s) URL, and use the surrounding JSON key
 * name + extension (when present) as hints to score/rank candidates and to
 * guess image vs video.
 */
'use strict';
const axios = require('axios');

const IMG_EXT_RE = /\.(jpe?g|png|gif|webp|bmp|avif)(\?|$)/i;
const VID_EXT_RE = /\.(mp4|webm|mov|m4v|mkv)(\?|$)/i;
const URL_RE = /^https?:\/\//i;

// Keys that are good signals this string IS the media link we want.
const GOOD_KEY_RE = /(url|image|img|photo|pic|picture|video|vid|link|src|download|media|result|file|content)/i;
// Keys that are bad signals (thumbnails, avatars of unrelated metadata, etc.)
const BAD_KEY_RE = /(thumb|avatar|icon|logo|favicon|profile_pic_owner)/i;
// Obviously-not-the-media-itself hosts/paths.
const IGNORE_URL_RE = /(prexzyvilla\.site\/(random|nsfw|download)\/[a-z]+\/?$)/i;

function walk(node, keyHint, out) {
    if (!node) return;
    if (typeof node === 'string') {
        if (!URL_RE.test(node)) return;
        if (IGNORE_URL_RE.test(node)) return;
        const isImg = IMG_EXT_RE.test(node);
        const isVid = VID_EXT_RE.test(node);
        const keyIsGood = keyHint && GOOD_KEY_RE.test(keyHint);
        const keyIsBad = keyHint && BAD_KEY_RE.test(keyHint);
        if (isImg || isVid || (keyIsGood && !keyIsBad) || !keyHint) {
            out.push({ url: node, isVid, isImg, keyHint: keyHint || '' });
        }
        return;
    }
    if (Array.isArray(node)) { for (const v of node) walk(v, keyHint, out); return; }
    if (typeof node === 'object') {
        for (const [k, v] of Object.entries(node)) walk(v, k, out);
    }
}

function pickBest(candidates) {
    if (!candidates.length) return null;
    // Prefer: explicit extension match > good key name > anything else.
    const ranked = [...candidates].sort((a, b) => {
        const score = (c) => (c.isImg || c.isVid ? 2 : 0) + (GOOD_KEY_RE.test(c.keyHint) ? 1 : 0);
        return score(b) - score(a);
    });
    const top = ranked[0];
    return { url: top.url, isVideo: top.isVid || /video|vid|mp4/i.test(top.keyHint) };
}

async function fetchRaw(endpoint, { timeout = 20000 } = {}) {
    const r = await axios.get(endpoint, {
        timeout,
        headers: { 'User-Agent': 'Mozilla/5.0 (SUKUNA-MD)' },
        validateStatus: () => true,
    });
    if (r.status >= 400) throw new Error(`API ${r.status}`);
    return r.data;
}

/** Same picking logic as fetchOneMedia, but for JSON you already fetched. */
function extractBestUrl(data) {
    const candidates = [];
    walk(data, null, candidates);
    return pickBest(candidates); // { url, isVideo } | null
}

/** Returns { url, isVideo } for the best media URL found in the response. */
async function fetchOneMedia(endpoint, opts) {
    const data = await fetchRaw(endpoint, opts);
    const best = extractBestUrl(data);
    if (!best) throw new Error('No media URL in response');
    return best;
}

/**
 * Calls the endpoint `count` times (each call is expected to return a fresh
 * random pick) and returns up to `count` deduplicated { url, isVideo } items.
 */
async function fetchManyMedia(endpoint, count, opts) {
    const results = await Promise.allSettled(
        Array.from({ length: count }, () => fetchOneMedia(endpoint, opts))
    );
    const seen = new Set();
    const out = [];
    for (const r of results) {
        if (r.status === 'fulfilled' && !seen.has(r.value.url)) {
            seen.add(r.value.url);
            out.push(r.value);
        }
    }
    return out;
}

module.exports = { fetchRaw, fetchOneMedia, fetchManyMedia, extractBestUrl };
