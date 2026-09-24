/**
 * 📘 NEXTY MINI 👀 — Facebook Downloader (FastSaver API)
 * ─────────────────────────────────────────────────────
 * Direct API integration with FastSaver.
 * Downloads Facebook videos & reels.
 */

const axios = require('axios');

// ═══ FastSaver API Config ═══
const FASTSAVER_API_KEY = 'fs_sk_0q5x5p9t6h7u6s9a9i9i3t4j7c2g';
const FASTSAVER_BASE_URL = 'https://api.fastsaver.io/v1';

async function facebookCommand(sock, from, msg, q) {
    try {
        // ─── Get URL ───
        let url = q;
        if (!url) {
            const messageContent = msg.message?.ephemeralMessage?.message
                                || msg.message?.viewOnceMessage?.message
                                || msg.message?.viewOnceMessageV2?.message
                                || msg.message;
            const text = (messageContent.conversation
                       || messageContent.extendedTextMessage?.text
                       || messageContent.imageMessage?.caption
                       || '').trim();
            url = text.replace(/^\.(fb|facebook|fbdl)\s+/i, '').trim();
        }

        // ─── Validate ───
        if (!url || !url.includes('facebook.com')) {
            return await sock.sendMessage(from, {
                text: `❌ *Please provide a Facebook video URL.*\n\n*Example:*\n▸ .fb https://www.facebook.com/xxx`
            }, { quoted: msg });
        }

        // ─── Loading reaction ───
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // ─── Processing message ───
        await sock.sendMessage(from, {
            text: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                  `┃  📘 *NEXTY MINI 👀 FB DL* 📘      ┃\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                  `╭─「 🔄 *PROCESSING* 」──────────\n` +
                  `│ ▸ Engine: FastSaver API\n` +
                  `│ ▸ Please wait...\n` +
                  `╰──────────────────────────────────\n\n` +
                  `> _Downloading from Facebook_ ⏳`
        }, { quoted: msg });

        // ═══ Call FastSaver API ═══
        console.log('[facebook] 🚀 Calling FastSaver API...');

        const { data } = await axios.get(
            `${FASTSAVER_BASE_URL}/fetch`,
            {
                params: { url: url },
                headers: {
                    'X-Api-Key': FASTSAVER_API_KEY
                },
                timeout: 90000
            }
        );

        console.log('[facebook] ✅ Response ok:', data.ok);

        // ─── Check response ───
        if (data.ok === false) {
            throw new Error(data.reason || 'API returned error');
        }

        if (!data.download_url) {
            throw new Error('No download URL in response');
        }

        const downloadUrl = data.download_url;
        const caption = data.caption || data.title || '';

        console.log('[facebook] 📥 Downloading media from CDN...');

        // ─── Download media ───
        const mediaResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*'
            },
            maxContentLength: 200 * 1024 * 1024
        });

        const mediaBuffer = Buffer.from(mediaResponse.data);

        if (mediaBuffer.length === 0) {
            throw new Error('Empty media file');
        }

        console.log('[facebook] ✅ Downloaded', mediaBuffer.length, 'bytes');

        // ─── Send media ───
        const botCaption = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                          `┃  📘 *NEXTY MINI 👀 FB* 📘         ┃\n` +
                          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                          `✅ *Downloaded Successfully*\n` +
                          `▸ Engine: FastSaver API\n` +
                          `▸ Type: Video 🎬\n` +
                          `${data.duration ? `▸ Duration: ${data.duration}s\n` : ''}` +
                          `${caption ? `▸ Caption: ${caption.substring(0, 80)}${caption.length > 80 ? '...' : ''}\n` : ''}` +
                          `\n> 👀 *POWERED BY NEXTY MINI 👀*`;

        await sock.sendMessage(from, {
            video: mediaBuffer,
            mimetype: 'video/mp4',
            caption: botCaption
        }, { quoted: msg });

        // ─── Success reaction ───
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

        console.log('[facebook] ✅ Sent successfully');

    } catch (err) {
        console.error('[facebook] ❌ Error:', err.message);

        let errorMsg = err.message;

        if (err.response) {
            console.error('[facebook] Status:', err.response.status);

            if (err.response.status === 401) {
                errorMsg = 'Invalid API key.';
            } else if (err.response.status === 429) {
                errorMsg = 'Rate limit exceeded. Wait 1 minute.';
            } else if (err.response.status === 402) {
                errorMsg = 'Out of credits. Add funds.';
            } else if (err.response.status === 400) {
                errorMsg = err.response.data?.reason || 'Private or deleted video.';
            } else if (err.response.status === 422) {
                errorMsg = 'Invalid Facebook URL.';
            } else if (err.response.status === 500) {
                errorMsg = 'FastSaver server error. Try again.';
            }
        }

        try {
            await sock.sendMessage(from, {
                text: `❌ *Facebook Download Error*\n\n\`${errorMsg}\``
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
        } catch (e) {}
    }
}

module.exports = facebookCommand;
