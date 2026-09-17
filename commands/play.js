/**
 * 🎵 NEXTY MINI — Play Command (Tornado API)
 * ──────────────────────────────────────────
 * Search & download YouTube audio (MP3).
 * 
 * Usage: .play <song name or YouTube URL>
 */

const axios = require('axios');
const yts = require('yt-search');

// ═══ Tornado API Config ═══
const TORNADO_API_KEY = 'sk_tornadoapi_trial_YOUR_NEW_KEY_HERE'; // ← Nayi key
const TORNADO_API_URL = 'https://api.tornadoapi.io/jobs';
const R2_BASE_URL = 'https://r2.tornadoapi.io';

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
                       || messageContent.videoMessage?.caption 
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
            image: { url: videoThumb },
            caption: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  🎵 *NEXTY MINI MUSIC* 🎵      ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `╭─「 💿 *NOW DOWNLOADING* 」──────\n` +
                     `│ ▸ *Title*  : ${videoTitle.substring(0, 45)}${videoTitle.length > 45 ? '...' : ''}\n` +
                     `${videoDuration ? `│ ▸ *Duration* : ${videoDuration}\n` : ''}` +
                     `${videoAuthor ? `│ ▸ *Author*   : ${videoAuthor}\n` : ''}` +
                     `│ ▸ *Engine* : Tornado API\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Please wait, downloading audio..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // ═══ Tornado API Call — Audio ═══
        console.log('[play] 🚀 Calling Tornado API...');

        const { data } = await axios.post(
            TORNADO_API_URL,
            {
                url: videoUrl,
                format: 'mp3',
                audio_quality: '128'
            },
            {
                headers: {
                    'x-api-key': TORNADO_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 180000
            }
        );

        console.log('[play] ✅ Response:', JSON.stringify(data).substring(0, 200));

        // ═══ Extract Download URL ═══
        let downloadUrl = null;

        if (data?.jobs?.[0]?.status === 'Completed') {
            const job = data.jobs[0];
            if (job.s3_url) downloadUrl = job.s3_url;
            else if (job.s3_key) downloadUrl = `${R2_BASE_URL}/${job.s3_key}`;
        } else if (data?.s3_url) {
            downloadUrl = data.s3_url;
        } else if (data?.job_id || data?.id) {
            const jobId = data.job_id || data.id;
            for (let i = 0; i < 40; i++) {
                await new Promise(r => setTimeout(r, 3000));
                try {
                    const jobRes = await axios.get(
                        `https://api.tornadoapi.io/jobs/${jobId}`,
                        { headers: { 'x-api-key': TORNADO_API_KEY } }
                    );
                    if (jobRes.data?.jobs?.[0]?.status === 'Completed') {
                        const j = jobRes.data.jobs[0];
                        downloadUrl = j.s3_url || `${R2_BASE_URL}/${j.s3_key}`;
                        break;
                    }
                } catch (e) {}
            }
        }

        if (!downloadUrl) {
            throw new Error('No download URL received');
        }

        // ═══ Send Audio ═══
        const fileName = (videoTitle || 'audio').replace(/[^\w\s-]/g, '').substring(0, 50) + '.mp3';

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
        else if (err.response?.status === 429) errorMsg = 'Rate limit. Wait 1 min.';
        else if (err.response?.status === 402) errorMsg = 'Out of credits.';

        try {
            await sock.sendMessage(chatId, { 
                text: `❌ *Play Error*\n\n\`${errorMsg}\`` 
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        } catch (e) {}
    }
}

module.exports = playCommand;
