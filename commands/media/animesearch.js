/**
 * .anime <query> — search anime via animekill
 */
'use strict';
const axios = require('axios');

function extractList(d) {
    const root = d?.data ?? d?.result ?? d?.results ?? d ?? {};
    if (Array.isArray(root)) return root;
    for (const k of ['results', 'data', 'animes', 'items', 'list']) {
        if (Array.isArray(root[k])) return root[k];
    }
    return [];
}

function pickThumb(o) {
    for (const k of ['image', 'poster', 'thumbnail', 'thumb', 'cover', 'img']) {
        const v = o?.[k];
        if (typeof v === 'string' && /^https?:\/\//.test(v)) return v;
    }
    return null;
}

function pickId(o) {
    return o?.anime_id || o?.id || o?.slug || o?.animeId || '';
}

module.exports = {
    name: 'animesearch',
    aliases: ['a', 'animedb'],
    description: 'Search anime shows/series (animekill)',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        if (!args.length) {
            return reply(
                `🎌 *Anime Search*\n\n` +
                `Usage: .anime <query>\n` +
                `Example: .anime jujutsu kaisen\n\n` +
                `_Then:_ .animeinfo <anime_id>`
            );
        }
        const query = args.join(' ').trim();
        try {
            await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });
            const ep = `https://prexzyapis.com/anime/animekill-search?query=${encodeURIComponent(query)}`;
            const r = await axios.get(ep, { timeout: 25000, validateStatus: () => true });
            if (r.status >= 400) throw new Error(`API ${r.status}`);
            const list = extractList(r.data);
            if (!list.length) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
                return reply(`❌ No anime found for *${query}*.`);
            }
            const top = list.slice(0, 10);
            let out = `🎌 *Anime Results — "${query}"*\n\n`;
            top.forEach((a, i) => {
                const title = a.title || a.name || a.romaji || 'Untitled';
                const id = pickId(a);
                const type = a.type || a.format || '';
                const eps = a.episodes || a.totalEpisodes || a.ep || '';
                out += `${i + 1}. *${title}*\n`;
                if (type || eps) out += `   ${type}${type && eps ? ' • ' : ''}${eps ? `${eps} ep` : ''}\n`;
                if (id) out += `   🆔 \`${id}\`\n`;
                out += `\n`;
            });
            out += `_Details:_ .animeinfo <anime_id>`;

            const thumb = top.map(pickThumb).find(Boolean);
            if (thumb) {
                try {
                    await sock.sendMessage(from, { image: { url: thumb }, caption: out }, { quoted: msg });
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                    return;
                } catch {}
            }
            await reply(out);
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[anime] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply('❌ Anime search failed. Try again later.');
        }
    },
};
