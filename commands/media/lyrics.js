/**
 * .lyrics <song> [by <artist>] — find full song lyrics
 *
 * Example: .lyrics lovely by Billie Eilish
 *
 * Robust multi-source strategy:
 *   1. If the user gave "<title> by <artist>", fetch full lyrics straight
 *      from lyrics.ovh.
 *   2. Otherwise (or if that misses) use the Genius search API to resolve
 *      the best matching title + primary artist, then pull the full lyrics
 *      from lyrics.ovh for that match.
 *   3. Fall back to the free lyrist API.
 * The full lyrics are sent, chunked so they never exceed WhatsApp limits.
 */
'use strict';
const axios = require('axios');

const GENIUS_TOKEN = 'oPSxDH9MWnORz8IYQuNhyvGoLxVCJ-ribPXtUuUkPH9qNVryxEhgpiN1L_LPp_jJOWpl9VrFDUBsQBa9jMWi3g';
const CHUNK = 3500;

function parseQuery(raw) {
    const byMatch = raw.match(/^(.+?)\s+by\s+(.+)$/i);
    if (byMatch) return { title: byMatch[1].trim(), artist: byMatch[2].trim() };
    return { title: raw.trim(), artist: '' };
}

// lyrics.ovh — returns full lyrics for an exact artist + title.
async function fromLyricsOvh(artist, title) {
    if (!artist || !title) return null;
    try {
        const r = await axios.get(
            `https://api.lyrics.ovh/v1/${encodeURIComponent(artist)}/${encodeURIComponent(title)}`,
            { timeout: 15000, validateStatus: () => true }
        );
        const lyr = r.data?.lyrics && String(r.data.lyrics).trim();
        if (r.status === 200 && lyr && lyr.length > 5) {
            return { title, artist, lyrics: lyr.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n') };
        }
    } catch (e) {
        console.error('[lyrics] lyrics.ovh failed:', e.code || e.message);
    }
    return null;
}

// Genius search — resolve the best matching title + primary artist.
async function geniusResolve(query) {
    try {
        const r = await axios.get('https://api.genius.com/search', {
            params: { q: query },
            headers: { Authorization: `Bearer ${GENIUS_TOKEN}` },
            timeout: 15000,
            validateStatus: () => true,
        });
        if (r.status !== 200) {
            console.error(`[lyrics] Genius HTTP ${r.status}:`, JSON.stringify(r.data).slice(0, 200));
            return null;
        }
        const hit = r.data?.response?.hits?.[0]?.result;
        if (!hit) return null;
        return {
            title: hit.title || query,
            artist: hit.primary_artist?.name || '',
            url: hit.url || '',
        };
    } catch (e) {
        console.error('[lyrics] Genius request failed:', e.code || e.message);
        return null;
    }
}

// lyrist — free fallback that also returns full lyrics.
async function fromLyrist(query) {
    try {
        const r = await axios.get(`https://lyrist.vercel.app/api/${encodeURIComponent(query)}`,
            { timeout: 15000, validateStatus: () => true });
        const lyr = r.data?.lyrics && String(r.data.lyrics).trim();
        if (r.status === 200 && lyr && lyr.length > 5) {
            return {
                title: r.data.title || query,
                artist: r.data.artist || '',
                lyrics: lyr.replace(/\r\n/g, '\n').replace(/\n{3,}/g, '\n\n'),
            };
        }
    } catch (e) {
        console.error('[lyrics] lyrist failed:', e.code || e.message);
    }
    return null;
}

async function findLyrics(raw) {
    const { title, artist } = parseQuery(raw);

    // 1) Direct hit if the user supplied the artist.
    if (artist) {
        const direct = await fromLyricsOvh(artist, title);
        if (direct) return direct;
    }

    // 2) Resolve via Genius, then pull full lyrics from lyrics.ovh.
    const resolved = await geniusResolve(raw);
    if (resolved?.artist) {
        const viaGenius = await fromLyricsOvh(resolved.artist, resolved.title);
        if (viaGenius) return { ...viaGenius, url: resolved.url };
    }

    // 3) Last-resort free API.
    const lyrist = await fromLyrist(raw);
    if (lyrist) return lyrist;

    return null;
}

module.exports = {
    name: 'lyrics',
    aliases: ['lyric', 'findlyrics'],
    description: 'Find full song lyrics',
    category: 'media',
    usage: '.lyrics <song> [by <artist>]',

    async execute({ sock, msg, from, reply, args }) {
        const raw = (args || []).join(' ').trim();
        if (!raw) {
            return reply(
                `🎵 *Lyrics Finder*\n\n` +
                `Usage: .lyrics <song> [by <artist>]\n` +
                `Example: .lyrics lovely by Billie Eilish`
            );
        }

        try {
            await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } }).catch(() => {});

            const result = await findLyrics(raw);

            if (!result || !result.lyrics) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                return reply(`❌ Couldn't find lyrics for *${raw}*.\nTry: .lyrics <song> by <artist>`);
            }

            const header = `🎵 *${result.title}*\n👤 ${result.artist || 'Unknown Artist'}\n` +
                (result.url ? `🔗 ${result.url}\n` : '') +
                `${'─'.repeat(18)}\n\n`;

            const full = header + result.lyrics + `\n\n> Lyrics via lyrics.ovh / Genius`;

            // Chunk so we never exceed WhatsApp's message size limit.
            if (full.length <= CHUNK) {
                await reply(full);
            } else {
                for (let i = 0; i < full.length; i += CHUNK) {
                    await sock.sendMessage(from, { text: full.slice(i, i + CHUNK) }, { quoted: msg });
                }
            }
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (err) {
            console.error('[lyrics] unexpected error:', err.message);
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
            reply('❌ Lyrics search failed. Try again later.');
        }
    },
};
