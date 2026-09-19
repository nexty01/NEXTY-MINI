/**
 * .anime <prompt> — fetch/generate an anime-style image matching the prompt
 *
 * (Note: anime SHOW/SERIES search moved to .animesearch — this command is
 * specifically for "give me a picture of X in anime style".)
 *
 * Providers (first success wins):
 *  1. prexzyapis.com/ai/anime — as given. Response shape was never
 *     confirmed live (every test request 400'd with no visible body), so
 *     this is parsed defensively via utils/prexzyShape.js rather than
 *     assuming one exact field name.
 *  2. Pollinations.ai (flux model, prompt boosted with anime-style keywords)
 *     — confirmed working, no API key needed. Used if provider 1 fails.
 */
'use strict';
const axios = require('axios');
const { extractImageUrls } = require('../../utils/prexzyShape');

async function tryPrexzyvillaAnime(prompt, negativePrompt) {
    try {
        const params = { prompt };
        if (negativePrompt) params.negative_prompt = negativePrompt;

        const { data } = await axios.get('https://prexzyapis.com/ai/anime', {
            params,
            timeout: 60000,
            validateStatus: () => true,
        });
        if (!data) return null;

        const urls = extractImageUrls(data);
        if (!urls.length) return null;

        const res = await axios.get(urls[0], { responseType: 'arraybuffer', timeout: 60000 });
        const buf = Buffer.from(res.data);
        if (!buf || buf.length < 1024) return null;
        return buf;
    } catch (e) {
        console.error('[anime] prexzyvilla ai/anime failed:', e.message);
        return null;
    }
}

async function tryPollinationsAnime(prompt, negativePrompt) {
    try {
        let fullPrompt = `${prompt}, anime style, anime art, vibrant, detailed, high quality`;
        if (negativePrompt) fullPrompt += `, avoid: ${negativePrompt}`;

        const res = await axios.get(
            'https://image.pollinations.ai/prompt/' + encodeURIComponent(fullPrompt),
            {
                params: {
                    model: 'flux',
                    width: 1024,
                    height: 1024,
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
        console.error('[anime] Pollinations fallback failed:', e.message);
        return null;
    }
}

module.exports = {
    name: 'anime',
    aliases: ['animeimg', 'animeart'],
    description: 'Generate/fetch an anime-style image from a prompt',
    category: 'media',
    usage: '.anime <prompt> [| negative prompt]',

    async execute({ sock, msg, from, reply, args }) {
        const full = (args || []).join(' ').trim();
        if (!full) {
            return reply(
                `🎌 *Anime Image*\n\n` +
                `Usage: .anime <prompt>\n` +
                `Example: .anime girl with pink hair in a cherry blossom garden\n\n` +
                `_Optional negative prompt:_ .anime <prompt> | <avoid this>\n` +
                `Example: .anime samurai at sunset | no text, no watermark`
            );
        }

        // Split "prompt | negative" if provided
        let prompt = full;
        let negativePrompt = '';
        if (full.includes('|')) {
            const [p, n] = full.split('|');
            prompt = p.trim();
            negativePrompt = (n || '').trim();
        }

        try {
            await sock.sendMessage(from, { react: { text: '🎨', key: msg.key } }).catch(() => {});

            let buffer = await tryPrexzyvillaAnime(prompt, negativePrompt);
            let provider = 'Prexzy AI (anime)';

            if (!buffer) {
                buffer = await tryPollinationsAnime(prompt, negativePrompt);
                provider = 'Pollinations (fallback)';
            }

            if (!buffer) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                return reply('❌ Couldn\'t generate an anime image right now. Try again in a moment.');
            }

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
            await sock.sendMessage(from, {
                image: buffer,
                caption: `🎌 *${prompt}*\n_via ${provider}_`,
            }, { quoted: msg });
        } catch (err) {
            console.error('[anime] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply('❌ Anime image generation failed. Try again later.');
        }
    },
};
