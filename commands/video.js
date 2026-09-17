/**
 * 🎬 NEXTY MINI — YouTube Video Downloader (FastSaver API)
 * ────────────────────────────────────────────────────────
 * Downloads YouTube videos up to 4K quality.
 * Note: YouTube costs 15 credits per download.
 */

const axios = require('axios');

const FASTSAVER_API_KEY = 'fs_sk_0q5x5p9t6h7u6s9a9i9i3t4j7c2g';
const FASTSAVER_BASE_URL = 'https://api.fastsaver.io/v1';

async function videoCommand(sock, from, msg, q) {
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
            url = text.replace(/^\.(video|yt|youtube)\s+/i, '').trim();
        }

        // ─── Validate ───
        if (!url || (!url.includes('youtube.com') && !url.includes('youtu.be'))) {
            return await sock.sendMessage(from, { 
                text: `❌ *Please provide a YouTube URL.*\n\n*Example:*\n▸ .video https://youtu.be/xxx`
            }, { quoted: msg });
        }

        // ─── Loading reaction ───
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // ─── Processing message ───
        await sock.sendMessage(from, {
            text: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                  `┃  🎬 *NEXTY MINI VIDEO* 🎬      ┃\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                  `╭─「 🔄 *PROCESSING* 」──────────\n` +
                  `│ ▸ Engine: FastSaver API\n` +
                  `│ ▸ Quality: 720p HD\n` +
                  `│ ▸ Cost: 15 credits\n` +
                  `│ ▸ Please wait...\n` +
                  `╰──────────────────────────────────\n\n` +
                  `> _Downloading from YouTube_ ⏳`
        }, { quoted: msg });

        // ═══ Call FastSaver API ═══
        // YouTube uses POST /youtube/download endpoint
        console.log('[video] 🚀 Calling FastSaver YouTube API...');

        const { data } = await axios.post(
            `${FASTSAVER_BASE_URL}/youtube/download`,
            {
                url: url,
                format: '720p'
            },
            {
                headers: {
                    'X-Api-Key': FASTSAVER_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 120000
            }
        );

        console.log('[video] ✅ Response ok:', data.ok);

        if (data.ok === false) {
            throw new Error(data.reason || 'API returned error');
        }

        // Extract download URL (may be in different fields)
        const downloadUrl = data.download_url || data.url || (data.data && data.data.url);
        
        if (!downloadUrl) {
            throw new Error('No download URL in response');
        }

        console.log('[video] 📥 Downloading media...');

        // ─── Download media ───
        const mediaResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 180000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*'
            },
            maxContentLength: 500 * 1024 * 1024
        });

        const mediaBuffer = Buffer.from(mediaResponse.data);

        if (mediaBuffer.length === 0) {
            throw new Error('Empty media file');
        }

        console.log('[video] ✅ Downloaded', mediaBuffer.length, 'bytes');

        // ─── Send media ───
        const title = data.title || data.data?.title || 'YouTube Video';
        const duration = data.duration || data.data?.duration || 0;

        const botCaption = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                          `┃  🎬 *NEXTY MINI VIDEO* 🎬      ┃\n` +
                          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                          `✅ *Downloaded Successfully*\n` +
                          `▸ Engine: FastSaver API\n` +
                          `▸ Type: Video 🎬\n` +
                          `▸ Quality: 720p HD\n` +
                          `${title ? `▸ Title: ${title.substring(0, 60)}${title.length > 60 ? '...' : ''}\n` : ''}` +
                          `${duration ? `▸ Duration: ${duration}s\n` : ''}` +
                          `\n> 👀 *POWERED BY NEXTY MINI*`;

        await sock.sendMessage(from, {
            video: mediaBuffer,
            mimetype: 'video/mp4',
            caption: botCaption
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error('[video] ❌ Error:', err.message);
        
        let errorMsg = err.message;
        if (err.response) {
            if (err.response.status === 401) errorMsg = 'Invalid API key.';
            else if (err.response.status === 429) errorMsg = 'Rate limit. Wait 1 min.';
            else if (err.response.status === 402) errorMsg = 'Out of credits (needs 15).';
            else if (err.response.status === 400) errorMsg = err.response.data?.reason || 'Video unavailable.';
            else if (err.response.status === 422) errorMsg = 'Invalid YouTube URL.';
        }
        
        try {
            await sock.sendMessage(from, { 
                text: `❌ *Video Download Error*\n\n\`${errorMsg}\`` 
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
        } catch (e) {}
    }
}

module.exports = videoCommand;
