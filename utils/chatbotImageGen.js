/**
 * chatbotImageGen — shared helper used by the DM chatbot and the group chatbot
 * to detect image-generation intent in a user's message and (if matched) send
 * a generated image. Uses the same prexzyvilla APIs as commands/ai/generate.js.
 */
const axios = require('axios');

const PRIMARY  = 'https://apis.prexzyvilla.site/ai/dalle';
const FALLBACK = 'https://apis.prexzyvilla.site/ai/realistic';

// Match common "make me an image" style phrasings and capture the subject.
const TRIGGERS = [
    /(?:generate|create|make|draw|design|render|produce|give\s*me)\s+(?:an?\s+|me\s+(?:an?\s+)?)?(?:image|picture|pic|photo|art|drawing|illustration|painting)\s+(?:of|about|showing|with|for)\s+(.+)/i,
    /(?:image|picture|pic|photo)\s+of\s+(.+)/i,
    /(?:draw|paint|sketch)\s+(?:me\s+)?(.+)/i,
];

function detectImagePrompt(text) {
    if (!text || typeof text !== 'string') return null;
    const t = text.trim();
    for (const re of TRIGGERS) {
        const m = t.match(re);
        if (m && m[1]) {
            const p = m[1].trim().replace(/[.!?]+$/, '');
            if (p.length >= 2 && p.length <= 400) return p;
        }
    }
    return null;
}

async function _fetchImageUrl(endpoint, prompt) {
    try {
        const { data } = await axios.get(endpoint, { params: { prompt }, timeout: 60000 });
        if (!data || data.status !== true) return null;
        const arr = data.image_url || data.images || data.result;
        if (Array.isArray(arr) && arr.length) {
            const first = arr[0];
            return first?.image?.url || first?.url || (typeof first === 'string' ? first : null);
        }
        if (typeof data.result === 'string') return data.result;
        if (typeof data.url === 'string') return data.url;
        return null;
    } catch (_) { return null; }
}

async function generateImageBuffer(prompt) {
    let url = await _fetchImageUrl(PRIMARY, prompt);
    let model = 'DALL·E 3 XL';
    if (!url) { url = await _fetchImageUrl(FALLBACK, prompt); model = 'Realistic'; }
    if (!url) return null;
    try {
        const r = await axios.get(url, { responseType: 'arraybuffer', timeout: 60000 });
        const buf = Buffer.from(r.data);
        if (!buf || buf.length < 1024) return null;
        return { buffer: buf, model };
    } catch (_) { return null; }
}

/**
 * If `text` looks like an image-gen request, generate and send it. Returns
 * true when handled (caller should skip the normal AI text reply).
 */
async function maybeSendGeneratedImage({ sock, from, msg, text }) {
    const prompt = detectImagePrompt(text);
    if (!prompt) return false;
    try {
        const out = await generateImageBuffer(prompt);
        if (!out) {
            await sock.sendMessage(from, { text: '🎨 I tried to draw that but the image servers refused. Try rewording it?' }, { quoted: msg });
            return true;
        }
        await sock.sendMessage(from, {
            image: out.buffer,
            caption: `🎨 Here you go — _${prompt}_`,
        }, { quoted: msg });
        return true;
    } catch (_) {
        return false;
    }
}

module.exports = { detectImagePrompt, generateImageBuffer, maybeSendGeneratedImage };
