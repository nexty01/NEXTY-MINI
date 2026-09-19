/**
 * .wallpaperanime — sends 5 random anime wallpapers
 *
 * Providers (first success wins, per-image fallback if needed):
 *  1. prexzyapis.com/random/anime/wallmlnime — as given. Response
 *     shape was never confirmed live (test request 500'd with no visible
 *     body), so parsed defensively. Called 5x in case it returns one
 *     image per call, with a check in case it returns several at once.
 *  2. Pollinations.ai (flux model, random anime wallpaper prompts) —
 *     confirmed working, no API key. Tops up to 5 if provider 1 falls short.
 */
'use strict';
const axios = require('axios');
const { extractImageUrls } = require('../../utils/prexzyShape');

const FALLBACK_PROMPTS = [
    'anime landscape wallpaper, cherry blossoms, vibrant sky, highly detailed',
    'anime city at night, neon lights, rain reflections, cinematic wallpaper',
    'anime fantasy forest wallpaper, magical lighting, ultra detailed',
    'anime character silhouette at sunset, dramatic sky, wallpaper art',
    'anime mountain scenery, studio ghibli style, peaceful wallpaper',
];

async function tryPrexzyvillaWallpaper() {
    try {
        const { data } = await axios.get('https://prexzyapis.com/random/anime/wallmlnime', {
            timeout: 30000,
            validateStatus: () => true,
        });
        if (!data) return null;
        const urls = extractImageUrls(data, 5);
        if (!urls.length) return null;
        return urls;
    } catch (e) {
        console.error('[wallpaperanime] prexzyvilla failed:', e.message);
        return null;
    }
}

async function downloadImage(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
        const buf = Buffer.from(res.data);
        if (!buf || buf.length < 1024) return null;
        return buf;
    } catch (e) {
        console.error('[wallpaperanime] download failed:', e.message);
        return null;
    }
}

async function pollinationsWallpaper(promptIdx) {
    try {
        const prompt = FALLBACK_PROMPTS[promptIdx % FALLBACK_PROMPTS.length];
        const res = await axios.get(
            'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt),
            {
                params: {
                    model: 'flux',
                    width: 1080,
                    height: 1920,
                    nologo: true,
                    enhance: true,
                    seed: Math.floor(Math.random() * 999999),
                },
                responseType: 'arraybuffer',
                timeout: 90000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            }
        );
        if (res.data && res.data.byteLength > 1024) return Buffer.from(res.data);
        return null;
    } catch (e) {
        console.error('[wallpaperanime] Pollinations fallback failed:', e.message);
        return null;
    }
}

module.exports = {
    name: 'wallpaperanime',
    aliases: ['animewallpaper', 'animewall'],
    description: 'Get 5 random anime wallpapers',
    category: 'media',

    async execute({ sock, msg, from, reply }) {
        try {
            await sock.sendMessage(from, { react: { text: '🖼️', key: msg.key } }).catch(() => {});

            const buffers = [];

            // Try the primary provider first — call repeatedly until we
            // have 5 unique images or it stops returning new ones.
            const seenUrls = new Set();
            for (let attempt = 0; attempt < 5 && buffers.length < 5; attempt++) {
                const urls = await tryPrexzyvillaWallpaper();
                if (!urls || !urls.length) break;
                for (const url of urls) {
                    if (buffers.length >= 5 || seenUrls.has(url)) continue;
                    seenUrls.add(url);
                    const buf = await downloadImage(url);
                    if (buf) buffers.push(buf);
                }
                if (urls.length > 1) break; // it returned a batch already
            }

            // Top up with fallback wallpapers if we don't have 5 yet.
            let fallbackIdx = 0;
            while (buffers.length < 5) {
                const buf = await pollinationsWallpaper(fallbackIdx++);
                if (buf) buffers.push(buf);
                else if (fallbackIdx > 10) break; // avoid an infinite loop if fallback is also down
            }

            if (!buffers.length) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                return reply('❌ Couldn\'t fetch any anime wallpapers right now. Try again shortly.');
            }

            for (let i = 0; i < buffers.length; i++) {
                await sock.sendMessage(from, {
                    image: buffers[i],
                    caption: i === 0 ? `🖼️ *Anime Wallpapers* (${buffers.length})` : undefined,
                }, { quoted: msg }).catch(() => {});
            }

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (err) {
            console.error('[wallpaperanime] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply('❌ Failed to fetch anime wallpapers. Try again later.');
        }
    },
};
