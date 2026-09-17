/**
 * 🎵 NEXTY MINI — Play Command (EliteProTech API)
 * ────────────────────────────────────────────────
 * Search & download YouTube audio (MP3).
 * Fastest API — 5-10 seconds response.
 * 
 * Usage: .play <song name or YouTube URL>
 */

const axios = require('axios');
const yts = require('yt-search');

// ═══ EliteProTech API Config ═══
const ELITE_API_URL = 'https://eliteprotech-apis.zone.id/download/ytmp3';

async function playCommand(sock, chatId, message, q) {
    try {
        await sock.sendMessage(chatId, { react: { text: '🎵', key: message.key } });

        // ─── Get Query ───
        let query = q;
        if (!query) {
            const messageContent = message.message?.ephemeralMessage?.message 
                                || message.message?.viewOnceMessage?.message 
                                || message.message?.viewOnceMessageV2?.message 
                                || message.message;
            const text = (messageContent.conversation 
                       || messageContent.extendedTextMessage?.text 
                       || messageContent.imageMessage?.caption 
                       || '').trim();
            query = text.replace(/^\.(play|song|music|ytmp3)\s+/i, '').trim();
        }

        if (!query) {
            return await sock.sendMessage(chatId, { 
                text: `❌ *Please provide a song name.*\n\n*Example:*\n▸ .play I Wanna Be Your Slave`
            }, { quoted: message });
        }

        // ─── Search YouTube ───
        console.log(`[play] 🔍 Searching: ${query}`);

        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;
        let videoUrl, videoTitle, videoThumb, videoDuration, videoAuthor;

        if (ytRegex.test(query)) {
            videoUrl = query;
            videoTitle = 'YouTube Audio';
        } else {
            const search = await yts(query);
            const video = search.videos[0];

            if (!video) {
                await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
                return await sock.sendMessage(chatId, { 
                    text: `❌ *No results found for:* \`${query}\`` 
                }, { quoted: message });
            }

            videoUrl = video.url;
            videoTitle = video.title;
            videoThumb = video.thumbnail;
            videoDuration = video.timestamp;
            videoAuthor = video.author?.name || 'Unknown';
        }

        // ─── Info Card ───
        await sock.sendMessage(chatId, {
            image: { url: videoThumb || 'https://i.postimg.cc/y6GV9P3H/file-000000004c307206bc366893b817568c-(1).png' },
            caption: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  🎵 *NEXTY MINI MUSIC* 🎵      ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `╭─「 💿 *NOW DOWNLOADING* 」──────\n` +
                     `│ ▸ *Title*  : ${videoTitle.substring(0, 45)}${videoTitle.length > 45 ? '...' : ''}\n` +
                     `${videoDuration ? `│ ▸ *Duration* : ${videoDuration}\n` : ''}` +
                     `${videoAuthor ? `│ ▸ *Author*   : ${videoAuthor}\n` : ''}` +
                     `│ ▸ *Engine* : EliteProTech API\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Please wait, downloading audio..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // ═══ EliteProTech API Call ═══
        console.log('[play] 🚀 Calling EliteProTech API...');

        const { data } = await axios.get(ELITE_API_URL, {
            params: { url: videoUrl },
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': 'application/json'
            }
        });

        console.log('[play] ✅ EliteProTech response:', JSON.stringify(data).substring(0, 250));

        // ═══ Extract Download URL ═══
        if (!data?.status || !data?.download?.downloadUrl) {
            throw new Error(data?.message || 'API returned no download URL');
        }

        const downloadUrl = data.download.downloadUrl;
        const apiTitle = data.download.title || videoTitle;
        const apiDuration = data.download.duration || '';
        const apiThumbnail = data.download.thumbnail || '';

        console.log('[play] ✅ Download URL:', downloadUrl.substring(0, 100));

        // ═══ Download Audio Buffer ═══
        console.log('[play] 📥 Downloading audio to buffer...');

        const audioResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'Accept': '*/*',
                'Referer': 'https://eliteprotech-apis.zone.id/'
            },
            maxContentLength: 200 * 1024 * 1024,
            transformResponse: [(d) => d]
        });

        const audioBuffer = Buffer.from(audioResponse.data);

        console.log('[play] ✅ Downloaded:', audioBuffer.length, 'bytes');

        if (!audioBuffer || audioBuffer.length < 10240) {
            throw new Error(`Audio file too small: ${audioBuffer.length} bytes`);
        }

        // ═══ Send Audio ═══
        const safeTitle = (apiTitle || 'NEXTY_MINI_Audio')
            .replace(/[^\w\s\-\.\(\)]/g, '')
            .substring(0, 60)
            .trim();
        const fileName = `${safeTitle}.mp3`;

        await sock.sendMessage(chatId, {
            audio: audioBuffer,
            mimetype: 'audio/mpeg',
            fileName: fileName,
            ptt: false
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

        console.log('[play] ✅ Sent successfully');

    } catch (err) {
        console.error('[play] ❌ Error:', err.message);

        let errorMsg = err.message;
        if (err.response?.status === 401) errorMsg = 'API unauthorized.';
        else if (err.response?.status === 429) errorMsg = 'Rate limit. Wait.';
        else if (err.response?.status === 404) errorMsg = 'Song not found.';
        else if (err.response?.status === 500) errorMsg = 'API server error.';

        try {
            await sock.sendMessage(chatId, { 
                text: `❌ *Play Error*\n\n\`${errorMsg}\`` 
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        } catch (e) {}
    }
}

module.exports = playCommand;
