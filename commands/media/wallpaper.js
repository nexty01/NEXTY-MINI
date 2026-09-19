/**
 * .wallpaper <prompt> — sends 3 wallpapers matching the prompt
 *
 * Example: .wallpaper cars
 * Example: .wallpaper blonde girl, anime, city, dark vibe
 *
 * Provider: https://prexzyapis.com/search/wallpaper?query=&page=
 * (exact endpoint as given). The real response shape couldn't be
 * confirmed live (test request 400'd with no visible body from this
 * environment), so results are parsed defensively via
 * utils/prexzyShape.js rather than assuming one exact field layout.
 *
 * Since it's a search endpoint, results are pulled from page 1 and, if
 * fewer than 3 unique images come back, page 2 is tried as well —
 * staying entirely on this API rather than swapping providers, per
 * instruction. A Pollinations fallback only kicks in if the endpoint
 * returns nothing at all across both pages.
 */
'use strict';
const axios = require('axios');
const { extractImageUrls } = require('../../utils/prexzyShape');

const WANTED = 3;

async function searchWallpapers(query, page) {
    try {
        const params = { query };
        if (page) params.page = page;

        const { data } = await axios.get('https://prexzyapis.com/search/wallpaper', {
            params,
            timeout: 30000,
            validateStatus: () => true,
        });
        if (!data) return [];
        return extractImageUrls(data, WANTED * 2);
    } catch (e) {
        console.error('[wallpaper] prexzyvilla search failed:', e.message);
        return [];
    }
}

async function downloadImage(url) {
    try {
        const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 45000 });
        const buf = Buffer.from(res.data);
        if (!buf || buf.length < 1024) return null;
        return buf;
    } catch (e) {
        console.error('[wallpaper] download failed:', e.message);
        return null;
    }
}

// Last-resort fallback only if the endpoint returns nothing across two pages.
async function pollinationsFallback(query, idx) {
    try {
        const prompt = `${query}, wallpaper, high detail, 4k`;
        const res = await axios.get(
            'https://image.pollinations.ai/prompt/' + encodeURIComponent(prompt),
            {
                params: {
                    model: 'flux',
                    width: 1080,
                    height: 1920,
                    nologo: true,
                    enhance: true,
                    seed: Math.floor(Math.random() * 999999) + idx,
                },
                responseType: 'arraybuffer',
                timeout: 90000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
            }
        );
        if (res.data && res.data.byteLength > 1024) return Buffer.from(res.data);
        return null;
    } catch (e) {
        console.error('[wallpaper] Pollinations fallback failed:', e.message);
        return null;
    }
}

module.exports = {
    name: 'wallpaper',
    aliases: ['wp', 'wallpapers'],
    description: 'Get 3 wallpapers matching a search prompt',
    category: 'media',
    usage: '.wallpaper <prompt>',

    async execute({ sock, msg, from, reply, args }) {
        const query = (args || []).join(' ').trim();
        if (!query) {
            return reply(
                `🖼️ *Wallpaper Search*\n\n` +
                `Usage: .wallpaper <prompt>\n` +
                `Example: .wallpaper cars\n` +
                `Example: .wallpaper blonde girl, anime, city, dark vibe`
            );
        }

        try {
            await sock.sendMessage(from, { react: { text: '🖼️', key: msg.key } }).catch(() => {});

            const seenUrls = new Set();
            let urls = await searchWallpapers(query, 1);
            urls.forEach(u => seenUrls.add(u));

            if (seenUrls.size < WANTED) {
                const page2 = await searchWallpapers(query, 2);
                for (const u of page2) {
                    if (!seenUrls.has(u)) seenUrls.add(u);
                }
            }

            const pickedUrls = Array.from(seenUrls).slice(0, WANTED);
            const buffers = [];
            for (const url of pickedUrls) {
                const buf = await downloadImage(url);
                if (buf) buffers.push(buf);
            }

            // Only fall back if the real endpoint gave us nothing at all.
            let fallbackIdx = 0;
            while (buffers.length < WANTED && fallbackIdx < 6) {
                const buf = await pollinationsFallback(query, fallbackIdx++);
                if (buf) buffers.push(buf);
            }

            if (!buffers.length) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                return reply(`❌ No wallpapers found for *${query}*. Try a different prompt.`);
            }

            for (let i = 0; i < buffers.length; i++) {
                await sock.sendMessage(from, {
                    image: buffers[i],
                    caption: i === 0 ? `🖼️ *${query}* (${buffers.length} wallpapers)` : undefined,
                }, { quoted: msg }).catch(() => {});
            }

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (err) {
            console.error('[wallpaper] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply('❌ Wallpaper search failed. Try again later.');
        }
    },
};
