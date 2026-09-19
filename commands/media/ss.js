/**
 * .ss — Website screenshot via prexzyvilla webss API
 * Usage: .ss https://example.com
 */

const API = 'https://prexzyapis.com/ssweb/webss?url=';

function normalizeUrl(input) {
    if (!input) return null;
    let u = input.trim();
    if (!/^https?:\/\//i.test(u)) u = 'https://' + u;
    try {
        const parsed = new URL(u);
        if (!parsed.hostname.includes('.')) return null;
        return parsed.toString();
    } catch { return null; }
}

module.exports = {
    name: 'ss',
    aliases: ['screenshot', 'webss', 'ssweb'],
    description: 'Screenshot a website. Usage: .ss <url>',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const target = normalizeUrl(args[0]);
        if (!target) {
            return reply('❓ Usage: *.ss <url>*\nExample: .ss https://google.com');
        }

        const apiUrl = API + encodeURIComponent(target);
        const ctrl = new AbortController();
        const timeout = setTimeout(() => ctrl.abort(), 45000);

        try {
            await reply(`📸 Capturing *${target}* ... please wait`);
            const res = await fetch(apiUrl, { signal: ctrl.signal, headers: { 'User-Agent': 'SukunaMD/3.0' } });
            const ct = res.headers.get('content-type') || '';

            if (!res.ok) {
                return reply(`⚠️ Screenshot API returned status ${res.status}.`);
            }

            if (ct.startsWith('image/')) {
                const buf = Buffer.from(await res.arrayBuffer());
                await sock.sendMessage(from, {
                    image: buf,
                    caption: `📸 Screenshot of ${target}`
                }, { quoted: msg });
                return;
            }

            if (ct.includes('application/json')) {
                const j = await res.json();
                if (j?.url && /^https?:\/\//.test(j.url)) {
                    await sock.sendMessage(from, {
                        image: { url: j.url },
                        caption: `📸 Screenshot of ${target}`
                    }, { quoted: msg });
                    return;
                }
                return reply(`⚠️ API error: ${j?.error || j?.message || 'unknown'}`);
            }

            return reply(`⚠️ Unexpected response type from screenshot API (${ct}).`);
        } catch (err) {
            if (err.name === 'AbortError') {
                return reply('⏱️ Screenshot request timed out. The site may be slow — try again.');
            }
            return reply(`⚠️ Screenshot failed: ${err.message}`);
        } finally {
            clearTimeout(timeout);
        }
    }
};
