const axios = require('axios');

const FASTSAVER_API_KEY = process.env.FASTSAVER_API_KEY;
const FASTSAVER_BASE_URL = 'https://api.fastsaver.io/v1';

async function instaCommand(sock, from, msg, q) {
    try {
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
            url = text.replace(/^\.(ig|insta|instagram)\s+/i, '').trim();
        }

        if (!url || !url.includes('instagram.com')) {
            return await sock.sendMessage(from, { 
                text: `❌ *Please provide an Instagram URL.*`
            }, { quoted: msg });
        }

        if (!FASTSAVER_API_KEY) {
            throw new Error('FASTSAVER_API_KEY not set in Railway variables.');
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        await sock.sendMessage(from, {
            text: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                  `┃  📸 *NEXTY MINI IG DL* 📸      ┃\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                  `╭─「 🔄 *PROCESSING* 」──────────\n` +
                  `│ ▸ Engine: FastSaver API\n` +
                  `│ ▸ 9 platforms supported\n` +
                  `│ ▸ Please wait...\n` +
                  `╰──────────────────────────────────\n\n` +
                  `> _Downloading from Instagram_ ⏳`
        }, { quoted: msg });

        const { data } = await axios.get(
            `${FASTSAVER_BASE_URL}/fetch`,
            {
                params: { url: url },
                headers: { 'X-Api-Key': FASTSAVER_API_KEY },
                timeout: 90000
            }
        );

        if (data.ok === false) {
            throw new Error(data.reason || 'API returned error');
        }

        if (!data.download_url) {
            throw new Error('No download URL in response');
        }

        const downloadUrl = data.download_url;
        const mediaType = data.type || 'video';
        const caption = data.caption || '';

        const mediaResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*'
            },
            maxContentLength: 200 * 1024 * 1024
        });

        const mediaBuffer = Buffer.from(mediaResponse.data);

        if (mediaBuffer.length === 0) {
            throw new Error('Empty media file');
        }

        const botCaption = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                          `┃  📸 *NEXTY MINI IG* 📸         ┃\n` +
                          `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                          `✅ *Downloaded Successfully*\n` +
                          `▸ Engine: FastSaver API\n` +
                          `▸ Type: ${mediaType === 'video' ? 'Video 🎬' : 'Photo 🖼️'}\n` +
                          `${data.duration ? `▸ Duration: ${data.duration}s\n` : ''}` +
                          `${data.width ? `▸ Resolution: ${data.width}x${data.height}\n` : ''}` +
                          `\n> 👀 *POWERED BY NEXTY MINI*`;

        if (mediaType === 'video') {
            await sock.sendMessage(from, {
                video: mediaBuffer,
                mimetype: 'video/mp4',
                caption: botCaption
            }, { quoted: msg });
        } else {
            await sock.sendMessage(from, {
                image: mediaBuffer,
                caption: botCaption
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error('[insta] ❌ Error:', err.message);
        
        let errorMsg = err.message;
        
        if (err.response) {
            if (err.response.status === 401) errorMsg = 'Invalid API key.';
            else if (err.response.status === 429) errorMsg = 'Rate limit. Wait 1 min.';
            else if (err.response.status === 402) errorMsg = 'Out of credits.';
            else if (err.response.status === 400) errorMsg = err.response.data?.reason || 'Private or deleted post.';
            else if (err.response.status === 422) errorMsg = 'Invalid Instagram URL.';
        }

        try {
            await sock.sendMessage(from, { 
                text: `❌ *Instagram Download Error*\n\n\`${errorMsg}\`` 
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
        } catch (e) {}
    }
}

module.exports = instaCommand;
