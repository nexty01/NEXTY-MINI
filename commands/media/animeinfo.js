/**
 * .animeinfo <name | MAL id> — anime details
 *
 * Primary source: AniList GraphQL (https://graphql.anilist.co) — fast, reliable,
 * no key required. Falls back to Jikan (MyAnimeList) if AniList is unreachable,
 * so a numeric MAL id still works and details stay available even when one
 * service is down.
 */
'use strict';
const axios = require('axios');

const JIKAN = 'https://api.jikan.moe/v4';
const ANILIST = 'https://graphql.anilist.co';

function trim(s, n) {
    if (!s) return '';
    s = String(s).replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
    return s.length > n ? s.slice(0, n - 1) + '…' : s;
}

// ── AniList ──────────────────────────────────────────────────────────────
const ANILIST_QUERY = `
query ($search: String, $id: Int) {
  Media(search: $search, id: $id, type: ANIME) {
    id
    title { romaji english native }
    format
    status
    episodes
    duration
    averageScore
    popularity
    genres
    studios(isMain: true) { nodes { name } }
    startDate { year month day }
    description(asHtml: false)
    siteUrl
    coverImage { extraLarge large medium }
  }
}`;

async function fromAniList({ search, id }) {
    const r = await axios.post(
        ANILIST,
        { query: ANILIST_QUERY, variables: id ? { id } : { search } },
        { headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, timeout: 15000, validateStatus: () => true }
    );
    const m = r.status === 200 ? r.data?.data?.Media : null;
    if (!m) return null;

    const statusMap = {
        FINISHED: 'Finished Airing', RELEASING: 'Currently Airing',
        NOT_YET_RELEASED: 'Not Yet Aired', CANCELLED: 'Cancelled', HIATUS: 'On Hiatus',
    };
    return {
        title: m.title?.english || m.title?.romaji || m.title?.native || 'Unknown',
        japanese: m.title?.native || '',
        type: m.format ? m.format.replace(/_/g, ' ') : '',
        status: statusMap[m.status] || m.status || '',
        episodes: m.episodes || '',
        duration: m.duration ? `${m.duration} min` : '',
        score: m.averageScore ? (m.averageScore / 10).toFixed(1) : '',
        rank: '',
        aired: m.startDate?.year ? String(m.startDate.year) : '',
        studios: (m.studios?.nodes || []).map(s => s.name).join(', '),
        genres: (m.genres || []).join(', '),
        synopsis: m.description || '',
        url: m.siteUrl || '',
        thumb: m.coverImage?.extraLarge || m.coverImage?.large || m.coverImage?.medium || '',
    };
}

// ── Jikan (fallback) ───────────────────────────────────────────────────────
async function jget(url, params) {
    let last = null;
    for (let i = 0; i < 3; i++) {
        try {
            const r = await axios.get(url, { params, timeout: 15000, validateStatus: () => true });
            if (r.status === 200) return r.data;
            last = `HTTP ${r.status}`;
        } catch (e) {
            last = e.message;
        }
        await new Promise(res => setTimeout(res, 1000));
    }
    throw new Error(last || 'request failed');
}

async function fromJikan(query) {
    let a;
    if (/^\d+$/.test(query)) {
        const d = await jget(`${JIKAN}/anime/${query}/full`);
        a = d?.data || null;
    } else {
        const d = await jget(`${JIKAN}/anime`, { q: query, limit: 1, sfw: true });
        a = d?.data?.[0] || null;
    }
    if (!a) return null;
    return {
        title: a.title_english || a.title || a.title_japanese || 'Unknown',
        japanese: a.title_japanese || '',
        type: a.type || '',
        status: a.status || '',
        episodes: a.episodes || '',
        duration: a.duration || '',
        score: a.score ? String(a.score) : '',
        rank: a.rank ? `#${a.rank}` : '',
        aired: a.aired?.string || (a.year ? String(a.year) : ''),
        studios: (a.studios || []).map(s => s.name).join(', '),
        genres: (a.genres || []).map(g => g.name).join(', '),
        synopsis: a.synopsis || '',
        url: a.url || '',
        thumb: a.images?.jpg?.large_image_url || a.images?.jpg?.image_url || a.images?.webp?.image_url || '',
    };
}

async function resolveAnime(query) {
    const isId = /^\d+$/.test(query);
    // Numeric id → prefer Jikan (MAL id). Otherwise AniList search first.
    if (isId) {
        try { const j = await fromJikan(query); if (j) return j; } catch (_) {}
        try { return await fromAniList({ id: Number(query) }); } catch (_) { return null; }
    }
    try { const a = await fromAniList({ search: query }); if (a) return a; } catch (_) {}
    try { return await fromJikan(query); } catch (_) { return null; }
}

module.exports = {
    name: 'animeinfo',
    aliases: ['animedetail', 'ainfo'],
    description: 'Get anime details by name or MyAnimeList id',
    category: 'media',
    usage: '.animeinfo <name | MAL id>',

    async execute({ sock, msg, from, reply, args }) {
        const query = (args || []).join(' ').trim();
        if (!query) {
            return reply(
                `🎌 *Anime Info*\n\n` +
                `Usage: .animeinfo <name | MAL id>\n` +
                `Example: .animeinfo jujutsu kaisen\n` +
                `Example: .animeinfo 40748`
            );
        }

        try {
            await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } }).catch(() => {});

            const a = await resolveAnime(query);
            if (!a) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                return reply(`❌ No anime found for *${query}*.`);
            }

            let out = `🎌 *${a.title}*\n`;
            if (a.japanese) out += `🇯🇵 ${a.japanese}\n`;
            out += `\n`;
            if (a.type)      out += `🎭 Type: ${a.type}\n`;
            if (a.status)    out += `📡 Status: ${a.status}\n`;
            if (a.episodes)  out += `🎞️ Episodes: ${a.episodes}\n`;
            if (a.duration)  out += `⏱️ Duration: ${a.duration}\n`;
            if (a.score)     out += `⭐ Score: ${a.score}\n`;
            if (a.rank)      out += `🏆 Rank: ${a.rank}\n`;
            if (a.aired)     out += `📅 Aired: ${a.aired}\n`;
            if (a.studios)   out += `🏢 Studio: ${a.studios}\n`;
            if (a.genres)    out += `🏷️ Genres: ${a.genres}\n`;
            if (a.synopsis)  out += `\n📖 ${trim(a.synopsis, 800)}\n`;
            if (a.url)       out += `\n🔗 ${a.url}`;

            if (a.thumb) {
                try {
                    await sock.sendMessage(from, { image: { url: a.thumb }, caption: out }, { quoted: msg });
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
                    return;
                } catch (_) { /* fall through */ }
            }
            await reply(out);
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (err) {
            console.error('[animeinfo] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply('❌ Anime info fetch failed. Try again later.');
        }
    },
};
