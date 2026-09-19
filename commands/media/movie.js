/**
 * Movie Command — TMDB info + trailer download via prexzyvilla + stream fallback
 *
 * .movie <title>         → poster card + trailer video sent in chat
 * .movie <title> 360p    → stream links (ezvidapi / vidsrc)
 * .movie <title> 480p    → stream links
 * .movie <title> 720p    → stream links
 */

'use strict';
const axios = require('axios');

const TMDB_BEARER =
    'eyJhbGciOiJIUzI1NiJ9.eyJhdWQiOiJkZTU0YThjMjgyODAxYjk1N2ZjOGExODFhYTk0NjE3YyIsIm5iZiI6MTc4MDI3NTA3MS4yNDEsInN1YiI6IjZhMWNkNzdmNGUyZjc2ZWY5Yzg4MDFjNCIsInNjb3BlcyI6WyJhcGlfcmVhZCJdLCJ2ZXJzaW9uIjoxfQ.-Fs4i0QMYRdAU6jXj-v8E9kyhPWVxKvTMjDJ7vKnCNk';
const TMDB_BASE  = 'https://api.themoviedb.org/3';
const IMG_BASE   = 'https://image.tmdb.org/t/p/w500';
const TMDB_HDR   = { accept: 'application/json', Authorization: `Bearer ${TMDB_BEARER}` };
const PREXZY_DL  = 'https://prexzyapis.com/download/youtube-video';

const QUALITY_MAP = {
    '360p': ['480p', '360p', '720p', '1080p'],
    '480p': ['480p', '720p', '1080p'],
    '720p': ['720p', '1080p', '480p'],
};
const VALID_QUALITIES = Object.keys(QUALITY_MAP);

// ─── TMDB helpers ─────────────────────────────────────────────────────────────
async function tmdbSearch(query) {
    const r = await axios.get(`${TMDB_BASE}/search/movie`, {
        params: { query, include_adult: false, language: 'en-US', page: 1 },
        headers: TMDB_HDR, timeout: 15000,
    });
    return r.data?.results || [];
}

async function tmdbDetails(id) {
    const r = await axios.get(`${TMDB_BASE}/movie/${id}`, {
        params: { append_to_response: 'credits,external_ids,videos' },
        headers: TMDB_HDR, timeout: 15000,
    });
    return r.data || {};
}

// ─── Pick best trailer from TMDB video list ───────────────────────────────────
function pickTrailerKey(videos) {
    if (!Array.isArray(videos?.results)) return null;
    const order = ['Official Trailer', 'Trailer', 'Teaser', 'Clip', 'Featurette'];
    for (const label of order) {
        const found = videos.results.find(
            v => v.site === 'YouTube' && v.type !== 'Bloopers' &&
                 v.name?.toLowerCase().includes(label.toLowerCase())
        );
        if (found) return found.key;
    }
    // fallback: any YouTube video
    const any = videos.results.find(v => v.site === 'YouTube');
    return any?.key || null;
}

// ─── Download trailer via prexzyvilla ────────────────────────────────────────
async function downloadTrailer(ytKey) {
    const ytUrl = `https://www.youtube.com/watch?v=${ytKey}`;
    try {
        const r = await axios.get(PREXZY_DL, {
            params: { url: ytUrl },
            timeout: 30000,
        });
        const d = r.data;
        // handle various response shapes
        const url =
            d?.data?.url     ||
            d?.data?.video   ||
            d?.result?.url   ||
            d?.url           ||
            d?.link          ||
            null;
        const thumb =
            d?.data?.thumbnail ||
            d?.data?.thumb     ||
            d?.thumbnail       ||
            null;
        const title =
            d?.data?.title ||
            d?.title       ||
            null;
        console.log('[movie] prexzy response keys:', Object.keys(d || {}));
        return { url, thumb, title, ytUrl };
    } catch (e) {
        console.error('[movie] prexzyvilla download failed:', e.message);
        return { url: null, thumb: null, title: null, ytUrl };
    }
}

// ─── Stream fallback links ────────────────────────────────────────────────────
function streamLinks(tmdbId) {
    return [
        `https://ezvidapi.com/embed/movie/${tmdbId}?provider=vidsrc`,
        `https://vidsrc.to/embed/movie/${tmdbId}`,
        `https://vidsrc.me/embed/movie?tmdb=${tmdbId}`,
    ];
}

// ─── Send helper: video first, image fallback, text last ─────────────────────
async function sendCard({ sock, from, msg, poster, caption, videoUrl, videoCaption }) {
    // 1. Try sending the trailer video
    if (videoUrl) {
        try {
            await sock.sendMessage(from, {
                video: { url: videoUrl },
                caption: videoCaption || caption,
                mimetype: 'video/mp4',
            }, { quoted: msg });
            return true;
        } catch (e) {
            console.error('[movie] video send failed:', e.message);
        }
    }
    // 2. Fallback to poster image + caption
    if (poster) {
        try {
            await sock.sendMessage(from, { image: { url: poster }, caption }, { quoted: msg });
            return true;
        } catch (e) {
            console.error('[movie] poster send failed:', e.message);
        }
    }
    // 3. Text only
    await sock.sendMessage(from, { text: caption }, { quoted: msg });
    return true;
}

// ─── Main command ─────────────────────────────────────────────────────────────
module.exports = {
    name: 'movie',
    aliases: ['movies', 'film', 'moviedl'],
    description: 'Search movies — sends trailer video + info card',
    category: 'media',

    async execute({ sock, msg, from, reply, args }) {
        if (!args.length) {
            return reply(
                `🎬 *SUKUNA Movie*\n\n` +
                `📌 *Search (sends trailer):*\n• .movie <title>\n\n` +
                `▶️ *Stream:*\n` +
                `• .movie <title> 360p\n` +
                `• .movie <title> 480p\n` +
                `• .movie <title> 720p\n\n` +
                `🎯 *Examples:*\n` +
                `• .movie inception\n` +
                `• .movie avengers 480p`
            );
        }

        const lastArg          = args[args.length - 1].toLowerCase();
        const isStreamReq      = VALID_QUALITIES.includes(lastArg);
        const requestedQuality = isStreamReq ? lastArg : null;
        const query            = isStreamReq
            ? args.slice(0, -1).join(' ').trim()
            : args.join(' ').trim();

        if (!query) return reply('❌ Please provide a movie title.');

        try {
            await sock.sendMessage(from, { react: { text: '🔍', key: msg.key } });

            // ── TMDB lookup ────────────────────────────────────────────────────
            const results = await tmdbSearch(query);
            if (!results.length) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
                return reply(`❌ No movies found for *${query}*.`);
            }

            const best    = results[0];
            const details = await tmdbDetails(best.id);

            const title    = details.title    || best.title    || query;
            const year     = (details.release_date || best.release_date || '').slice(0, 4) || '—';
            const rating   = details.vote_average ? `${details.vote_average.toFixed(1)}/10` : 'N/A';
            const runtime  = details.runtime   ? `${details.runtime} min` : 'N/A';
            const genres   = (details.genres   || []).map(g => g.name).join(', ') || 'N/A';
            const overview = (details.overview || best.overview || 'No synopsis available.').slice(0, 300);
            const director = (details.credits?.crew || []).find(c => c.job === 'Director')?.name || 'N/A';
            const cast     = (details.credits?.cast || []).slice(0, 4).map(c => c.name).join(', ') || 'N/A';
            const poster   = details.poster_path ? `${IMG_BASE}${details.poster_path}` : null;
            const tmdbId   = details.id || best.id;
            const tmdbUrl  = `https://www.themoviedb.org/movie/${tmdbId}`;

            // ── STREAM mode ────────────────────────────────────────────────────
            if (isStreamReq) {
                await sock.sendMessage(from, { react: { text: '▶️', key: msg.key } });
                const links = streamLinks(tmdbId);

                let txt  = `🎬 *${title}* (${year})\n`;
                txt     += `━━━━━━━━━━━━━━━━━━━━\n`;
                txt     += `📹 *Quality:* ${requestedQuality}\n`;
                txt     += `━━━━━━━━━━━━━━━━━━━━\n`;
                txt     += `▶️ *Stream Links:*\n`;
                links.forEach((l, i) => { txt += `${i + 1}. ${l}\n`; });
                txt     += `\n_Open in browser to watch_ 🍿`;

                await sendCard({ sock, from, msg, poster, caption: txt });
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                return;
            }

            // ── INFO + TRAILER mode ────────────────────────────────────────────
            await sock.sendMessage(from, { react: { text: '🎬', key: msg.key } });

            // Build info caption
            let infoText  = `🎬 *${title}* (${year})\n`;
            infoText     += `━━━━━━━━━━━━━━━━━━━━\n`;
            infoText     += `⭐ *Rating:* ${rating}\n`;
            infoText     += `🎭 *Genre:* ${genres}\n`;
            infoText     += `⏱️ *Runtime:* ${runtime}\n`;
            infoText     += `🎬 *Director:* ${director}\n`;
            infoText     += `🌟 *Cast:* ${cast}\n`;
            infoText     += `━━━━━━━━━━━━━━━━━━━━\n`;
            infoText     += `📖 ${overview}\n`;
            infoText     += `━━━━━━━━━━━━━━━━━━━━\n`;
            infoText     += `🔗 ${tmdbUrl}\n\n`;
            infoText     += `▶️ *Stream:*\n`;
            infoText     += `• .movie ${title} 360p\n`;
            infoText     += `• .movie ${title} 480p\n`;
            infoText     += `• .movie ${title} 720p`;

            // Send info card first (poster image)
            if (poster) {
                try {
                    await sock.sendMessage(from, { image: { url: poster }, caption: infoText }, { quoted: msg });
                } catch (_) {
                    await reply(infoText);
                }
            } else {
                await reply(infoText);
            }

            // Now fetch + send trailer
            const trailerKey = pickTrailerKey(details.videos);
            if (!trailerKey) {
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                return; // no trailer available, info card is enough
            }

            await sock.sendMessage(from, { react: { text: '⬇️', key: msg.key } });

            const trailer = await downloadTrailer(trailerKey);

            if (trailer.url) {
                const trailerCaption =
                    `🎬 *${title}* — Official Trailer\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `⭐ ${rating}  🎭 ${genres}  ⏱️ ${runtime}\n` +
                    `━━━━━━━━━━━━━━━━━━━━\n` +
                    `📺 _Powered by SUKUNA MD_`;

                try {
                    await sock.sendMessage(from, {
                        video: { url: trailer.url },
                        caption: trailerCaption,
                        mimetype: 'video/mp4',
                    }, { quoted: msg });
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                } catch (e) {
                    console.error('[movie] trailer video send failed:', e.message);
                    // send as YouTube link fallback
                    await sock.sendMessage(from,
                        { text: `▶️ *Trailer:* ${trailer.ytUrl}` },
                        { quoted: msg }
                    );
                    await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                }
            } else {
                // prexzyvilla couldn't get URL — send YouTube link directly
                await sock.sendMessage(from,
                    { text: `▶️ *Trailer:* ${trailer.ytUrl}` },
                    { quoted: msg }
                );
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
            }

        } catch (err) {
            console.error('[movie] fatal error:', err.message);
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
            reply('❌ Movie command failed. Please try again later.');
        }
    },
};
