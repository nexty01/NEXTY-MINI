/**
 * 🎵 NEXTY MINI — Play Command (Cobalt API)
 * ──────────────────────────────────────────
 * Search & download YouTube audio (MP3).
 * Powered by self-hosted Cobalt API.
 * 
 * Usage: .play <song name or YouTube URL>
 */

const axios = require('axios');
const yts = require('yt-search');

// ═══ Cobalt API Config ═══
const COBALT_URL = 'https://cobalt-tools-production-82e7.up.railway.app/';

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
                     `│ ▸ *Engine* : Cobalt API\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Please wait, downloading audio..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // ═══ Cobalt API Call — Audio ═══
        console.log('[play] 🚀 Calling Cobalt API...');

        const { data } = await axios.post(
            COBALT_URL,
            {
                url: videoUrl,
                downloadMode: 'audio',
                audioFormat: 'mp3'
            },
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                timeout: 180000
            }
        );

        console.log('[play] ✅ Response:', JSON.stringify(data).substring(0, 200));

        // ═══ Check Response ═══
        let downloadUrl = null;

        if (data?.status === 'redirect' || data?.status === 'tunnel') {
            downloadUrl = data.url;
        } else if (data?.status === 'picker') {
            // Multiple items — pick first audio
            if (data.picker && data.picker.length > 0) {
                downloadUrl = data.picker[0].url;
            }
        } else if (data?.url) {
            downloadUrl = data.url;
        }

        if (!downloadUrl) {
            throw new Error(data?.error?.code || 'No download URL received');
        }

        console.log('[play] ✅ Download URL:', downloadUrl.substring(0, 80));

        // ═══ Send Audio ═══
        const fileName = (data.filename || videoTitle || 'audio').replace(/[^\w\s\-\.\(\)]/g, '').substring(0, 80) + '.mp3';

        await sock.sendMessage(chatId, {
            audio: { url: downloadUrl },
            mimetype: 'audio/mpeg',
            fileName: fileName,
            ptt: false
        }, { quoted: message });

        await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });

    } catch (err) {
        console.error('[play] ❌ Error:', err.message);

        let errorMsg = err.message;
        if (err.response?.status === 401) errorMsg = 'Invalid API key.';
        else if (err.response?.status === 422) errorMsg = 'Audio format not supported.';
        else if (err.response?.status === 429) errorMsg = 'Rate limit. Wait 1 min.';
        else if (err.response?.status === 500) errorMsg = 'Cobalt server error. Try again.';

        try {
            await sock.sendMessage(chatId, { 
                text: `❌ *Play Error*\n\n\`${errorMsg}\`` 
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        } catch (e) {}
    }
}

module.exports = playCommand;
