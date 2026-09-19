/**
 * TikTok Command — Download TikTok videos / image slideshows (no watermark)
 * Usage: .tt <url>  |  .tiktok <url>
 */

'use strict';
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

function ensureTempDir() {
    const tempDir = path.join(__dirname, '../../temp');
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    return tempDir;
}

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
           '(KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const TIKTOK_RE = /https?:\/\/(?:www\.|vm\.|vt\.|m\.)?tiktok\.com\/[^\s]+/i;

function firstUrl(s) {
    if (!s) return null;
    if (typeof s === 'string' && /^https?:\/\//.test(s)) return s;
    if (Array.isArray(s) && s.length && typeof s[0] === 'string') return s[0];
    return null;
}

/** Normalise a possibly-relative tikwm path into an absolute URL. */
function absUrl(u) {
    if (!u || typeof u !== 'string') return null;
    if (/^https?:\/\//.test(u)) return u;
    if (u.startsWith('/')) return `https://www.tikwm.com${u}`;
    return null;
}

/* ── Primary: tikwm (reliable, returns no-watermark video + slideshows) ── */
async function fromTikwm(url) {
    const r = await axios.get('https://www.tikwm.com/api/', {
        params: { url, hd: 1 },
        timeout: 30000,
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        validateStatus: () => true,
    });
    const d = r.data?.data;
    if (!d) return null;

    const meta = {
        title:  d.title || 'TikTok',
        author: d.author?.nickname || d.author?.unique_id || 'Unknown',
        music:  absUrl(d.music) || null,
    };

    // Image slideshow post
    if (Array.isArray(d.images) && d.images.length) {
        return { images: d.images.map(absUrl).filter(Boolean), meta };
    }

    const videos = [absUrl(d.hdplay), absUrl(d.play), absUrl(d.wmplay)].filter(Boolean);
    if (videos.length) return { videos, meta };
    return null;
}

/* ── Fallback: prexzyvilla endpoints ── */
async function fromPrexzy(url) {
    const endpoints = [
        `https://prexzyapis.com/download/tiktokvideo?url=${encodeURIComponent(url)}`,
        `https://prexzyapis.com/download/tiktok?url=${encodeURIComponent(url)}`,
    ];
    for (const ep of endpoints) {
        try {
            const r = await axios.get(ep, {
                timeout: 30000,
                headers: { 'User-Agent': UA },
                validateStatus: () => true,
            });
            const d = r.data || {};
            const root = d.data || d.result || d;
            const videos = [
                firstUrl(root.no_watermark), firstUrl(root.nowm),
                firstUrl(root.hdplay), firstUrl(root.play),
                firstUrl(root.video), firstUrl(root.url),
                firstUrl(root.download_url), firstUrl(root.videoUrl),
            ].filter(Boolean);
            if (videos.length) {
                return {
                    videos,
                    meta: {
                        title:  root.title || root.desc || 'TikTok',
                        author: root.author?.nickname || root.author || root.username || 'Unknown',
                    },
                };
            }
        } catch (_) { /* try next */ }
    }
    return null;
}

async function resolve(url) {
    // Try each source in order; never throw — return null on total failure.
    for (const fn of [fromTikwm, fromPrexzy]) {
        try {
            const out = await fn(url);
            if (out && (out.videos?.length || (out.images && out.images.length))) return out;
        } catch (_) { /* next source */ }
    }
    return null;
}

/**
 * Download a candidate video URL ourselves and remux it with +faststart.
 * This is the actual fix for "something is wrong with the video file":
 * handing WhatsApp a bare URL means Baileys fetches it and uploads
 * whatever it gets, with no check that it's a complete/valid video or
 * that the moov atom (metadata index) is at the front of the file —
 * which WhatsApp's player requires to even open it. HD links from
 * these free scrapers occasionally come back truncated, as an HTML
 * error page, or without faststart, and get sent anyway.
 * Throws if the candidate isn't usable, so the caller can try the next one.
 */
async function downloadAndFixVideo(url, tempDir) {
    const res = await axios.get(url, {
        responseType: 'arraybuffer',
        timeout: 60000,
        maxContentLength: 100 * 1024 * 1024,
        headers: { 'User-Agent': UA },
        validateStatus: () => true,
    });

    const contentType = res.headers?.['content-type'] || '';
    const size = res.data?.length || 0;
    if (res.status !== 200 || !contentType.includes('video') || size < 10000) {
        throw new Error(`bad candidate (status ${res.status}, type "${contentType}", ${size} bytes)`);
    }

    const rawPath = path.join(tempDir, `tt_${Date.now()}_raw.mp4`);
    const fixedPath = rawPath.replace('_raw.mp4', '_fixed.mp4');
    fs.writeFileSync(rawPath, Buffer.from(res.data));

    try {
        // Fast stream copy — just relocates the moov atom to the front.
        // No re-encoding, so this is cheap even on modest hosting.
        await execAsync(`ffmpeg -y -i "${rawPath}" -c copy -movflags +faststart "${fixedPath}"`);
        return fs.readFileSync(fixedPath);
    } catch (e) {
        console.error('[tiktok] remux failed, sending as-downloaded:', e.message);
        return fs.readFileSync(rawPath);
    } finally {
        [rawPath, fixedPath].forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });
    }
}

module.exports = {
    name: 'tiktok',
    aliases: ['tt', 'ttdl'],
    description: 'Download TikTok videos / slideshows without watermark',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const input = (args || []).join(' ').trim();
        if (!input) {
            return reply(
                `🎵 *TikTok Downloader*\n\n` +
                `Usage: .tt <tiktok url>\n` +
                `Example: .tt https://vm.tiktok.com/xxxxx`
            );
        }

        const match = input.match(TIKTOK_RE);
        const url = match ? match[0] : null;
        if (!url) {
            return reply('❌ Please provide a valid TikTok URL.');
        }

        try {
            await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } }).catch(() => {});

            const result = await resolve(url);
            if (!result) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                return reply('❌ Failed to download. The video may be private, removed, or the URL is invalid.');
            }

            const { meta } = result;
            const cap = `🎵 *${meta.title}*\n👤 ${meta.author}\n\n> SUKUNA MD`;

            // Image slideshow → send each image
            if (result.images && result.images.length) {
                for (let i = 0; i < result.images.length; i++) {
                    await sock.sendMessage(from, {
                        image:   { url: result.images[i] },
                        caption: i === 0 ? cap : undefined,
                    }, { quoted: msg }).catch(() => {});
                }
                if (meta.music) {
                    await sock.sendMessage(from, {
                        audio:    { url: meta.music },
                        mimetype: 'audio/mpeg',
                    }, { quoted: msg }).catch(() => {});
                }
                await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
                return;
            }

            // Standard video — try each candidate quality until one actually
            // downloads as a valid, playable file.
            const tempDir = ensureTempDir();
            let videoBuffer = null;
            let lastErr = null;
            for (const candidateUrl of result.videos) {
                try {
                    videoBuffer = await downloadAndFixVideo(candidateUrl, tempDir);
                    if (videoBuffer && videoBuffer.length > 10000) break;
                } catch (e) {
                    lastErr = e;
                    console.error('[tiktok] candidate failed:', e.message);
                    videoBuffer = null;
                }
            }

            if (!videoBuffer) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
                console.error('[tiktok] all candidates failed:', lastErr?.message);
                return reply('❌ Downloaded video was invalid or corrupted. Try again or send a different link.');
            }

            await sock.sendMessage(from, {
                video:    videoBuffer,
                mimetype: 'video/mp4',
                caption:  cap,
            }, { quoted: msg });

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } }).catch(() => {});
        } catch (err) {
            console.error('[tiktok] error:', err.message);
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }).catch(() => {});
            reply('❌ An error occurred while downloading.');
        }
    }
};
