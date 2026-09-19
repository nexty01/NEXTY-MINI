/**
 * Random TikTok Girl Video Command
 * Usage: .tiktokgirl
 *
 * Robust multi-provider downloader (same structure as the new .tiksearch):
 *   1. Try multiple "random tiktok girl" endpoints in order.
 *   2. For each provider, collect every candidate URL it returns.
 *   3. Walk the URL list with browser-like headers + retry/backoff.
 *   4. Reject 0-byte / <10KB / 4xx responses and move to the next URL.
 *   5. If everything fails, fall back to a fresh CDN resolution via
 *      tikwm.com/api/?url=<page>&hd=1 when we have a TikTok page URL.
 *
 * No new dependencies — uses axios only.
 */
'use strict';

const axios = require('axios');

const UA =
    'Mozilla/5.0 (Linux; Android 13; SM-S918B) AppleWebKit/537.36 ' +
    '(KHTML, like Gecko) Chrome/124.0 Mobile Safari/537.36';

const DL_HEADERS = {
    'User-Agent': UA,
    'Referer':    'https://www.tiktok.com/',
    'Accept':     'video/mp4,video/*;q=0.9,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9',
};

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Walk ANY JSON shape and collect every plausible media URL (videos preferred). */
function collectUrls(node, out = [], depth = 0) {
    if (depth > 6 || !node) return out;
    if (typeof node === 'string') {
        if (/^https?:\/\//i.test(node)) out.push(node);
        return out;
    }
    if (Array.isArray(node)) {
        for (const v of node) collectUrls(v, out, depth + 1);
        return out;
    }
    if (typeof node === 'object') {
        const priority = ['hdplay','play','wmplay','video','videoUrl','video_url','mp4','url','link','media','result','data','file','download'];
        for (const k of priority) if (node[k] !== undefined) collectUrls(node[k], out, depth + 1);
        for (const [k, v] of Object.entries(node)) {
            if (priority.includes(k)) continue;
            collectUrls(v, out, depth + 1);
        }
    }
    return out;
}

function rankUrls(urls) {
    // Prefer video extensions / hd hints; de-dupe; cap.
    const seen = new Set();
    const score = (u) => {
        let s = 0;
        if (/\.mp4(\?|$)/i.test(u))   s += 5;
        if (/hd|1080|720/i.test(u))   s += 3;
        if (/play|video|mp4/i.test(u))s += 1;
        if (/\.(jpe?g|png|webp|gif)(\?|$)/i.test(u)) s -= 10;
        return s;
    };
    return urls
        .filter(u => { if (seen.has(u)) return false; seen.add(u); return true; })
        .sort((a, b) => score(b) - score(a))
        .slice(0, 12);
}

/** Provider chain — each returns { urls: string[], pageUrl?: string }. */
const PROVIDERS = [
    {
        name: 'prexzyvilla',
        async fetch() {
            const r = await axios.get('https://prexzyapis.com/random/tiktokgirl', {
                timeout: 20000, headers: { 'User-Agent': UA }, validateStatus: () => true,
            });
            if (r.status >= 400) throw new Error('prexzyvilla ' + r.status);
            return { urls: collectUrls(r.data), pageUrl: r.data?.webVideoUrl || r.data?.share_url };
        },
    },
    {
        name: 'tikwm-trending',
        async fetch() {
            // tikwm trending feed — pick a random clip
            const r = await axios.post('https://www.tikwm.com/api/feed/list', null, {
                params: { region: 'US', count: 30, cursor: 0, web: 1, hd: 1 },
                timeout: 20000, headers: { 'User-Agent': UA }, validateStatus: () => true,
            });
            const list = r.data?.data || [];
            if (!list.length) throw new Error('tikwm empty');
            const pick = list[Math.floor(Math.random() * list.length)];
            const urls = [pick.hdplay, pick.play, pick.wmplay].filter(Boolean)
                .map(u => u.startsWith('http') ? u : `https://www.tikwm.com${u}`);
            return { urls, pageUrl: pick.share_url };
        },
    },
    {
        name: 'delirius',
        async fetch() {
            const r = await axios.get('https://delirius-apiofc.vercel.app/random/tiktokgirl', {
                timeout: 20000, headers: { 'User-Agent': UA }, validateStatus: () => true,
            });
            if (r.status >= 400) throw new Error('delirius ' + r.status);
            return { urls: collectUrls(r.data) };
        },
    },
];

async function tryDownload(url) {
    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const r = await axios.get(url, {
                timeout: 45000,
                responseType: 'arraybuffer',
                maxRedirects: 5,
                headers: DL_HEADERS,
                validateStatus: () => true,
            });
            if (r.status >= 400) throw new Error('HTTP ' + r.status);
            const buf = Buffer.from(r.data);
            if (buf.length < 10 * 1024) throw new Error('tiny body ' + buf.length);
            return { buf, mime: r.headers['content-type'] || 'video/mp4' };
        } catch (e) {
            if (attempt === 1) return null;
            await sleep(400 * (attempt + 1));
        }
    }
    return null;
}

async function resolveViaTikwm(pageUrl) {
    if (!pageUrl) return [];
    try {
        const r = await axios.get('https://tikwm.com/api/', {
            params: { url: pageUrl, hd: 1 },
            timeout: 20000, headers: { 'User-Agent': UA }, validateStatus: () => true,
        });
        const d = r.data?.data;
        if (!d) return [];
        return [d.hdplay, d.play, d.wmplay].filter(Boolean)
            .map(u => u.startsWith('http') ? u : `https://www.tikwm.com${u}`);
    } catch { return []; }
}

module.exports = {
    name: 'tiktokgirl',
    aliases: ['tiktokgirls', 'tgirl'],
    description: 'Sends a random TikTok girl video',
    category: 'media',

    async execute({ sock, msg, from, reply }) {
        try {
            await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

            let lastErr = null;
            for (const prov of PROVIDERS) {
                let payload;
                try { payload = await prov.fetch(); }
                catch (e) { lastErr = e; continue; }

                const candidates = rankUrls(payload.urls || []);
                if (!candidates.length && payload.pageUrl) {
                    candidates.push(...await resolveViaTikwm(payload.pageUrl));
                }

                for (const url of candidates) {
                    const got = await tryDownload(url);
                    if (got) {
                        await sock.sendMessage(from, {
                            video:    got.buf,
                            mimetype: 'video/mp4',
                            caption:  '🎵 *Random TikTok Girl*\n\n> _SUKUNA MD_',
                        }, { quoted: msg });
                        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                        return;
                    }
                }

                // last-ditch: re-resolve fresh CDN URL via tikwm
                if (payload.pageUrl) {
                    for (const url of await resolveViaTikwm(payload.pageUrl)) {
                        const got = await tryDownload(url);
                        if (got) {
                            await sock.sendMessage(from, {
                                video: got.buf, mimetype: 'video/mp4',
                                caption: '🎵 *Random TikTok Girl*\n\n> _SUKUNA MD_',
                            }, { quoted: msg });
                            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
                            return;
                        }
                    }
                }
            }

            throw lastErr || new Error('All providers exhausted');
        } catch (err) {
            console.error('[tiktokgirl] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply(
                '╭─❒ ◈ 𝙎𝙐𝙆𝙐𝙉𝘼 𝙈𝘿 ❒\n' +
                "│ ❌ 𝑪𝒐𝒖𝒍𝒅𝒏'𝒕 𝒇𝒆𝒕𝒄𝒉 𝒂 𝒗𝒊𝒅𝒆𝒐 𝒓𝒊𝒈𝒉𝒕 𝒏𝒐𝒘. 𝑻𝒓𝒚 𝒂𝒈𝒂𝒊𝒏 𝒊𝒏 𝒂 𝒎𝒐𝒎𝒆𝒏𝒕.\n" +
                '╰─⛧ 𝙎𝙪𝙠𝙪𝙣𝙖 𝙈𝘿'
            );
        }
    },
};
