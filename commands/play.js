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
const TORNADO_API_KEY = 'sk_tornadoapi_trial_LH58MaBxJ7Gh5LUskXp7Tp0kZCCTyeXZPS5lhbJOK10m5ge__mwir6Vv5sfuUdn1nAQRGbLcITmn2txGu2hDFg';
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
                     `│ ▸ *Engine* : Tornado API\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Please wait, downloading audio..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // ═══ Tornado API Call ═══
        console.log('[play] 🚀 Calling Tornado API...');

        const { data } = await axios.post(
            TORNADO_API_URL,
            {
                url: videoUrl,
                format: 'mp3'
            },
            {
                headers: {
                    'x-api-key': TORNADO_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 180000
            }
        );

        console.log('[play] ✅ Tornado response:', JSON.stringify(data).substring(0, 200));

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
            console.log('[play] ⏳ Polling job:', jobId);

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
                        console.log('[play] ✅ Job completed');
                        break;
                    }
                    if (jobRes.data?.jobs?.[0]?.status === 'Failed') {
                        throw new Error('Tornado job failed');
                    }
                } catch (e) {
                    if (e.message === 'Tornado job failed') throw e;
                }
            }
        }

        if (!downloadUrl) {
            throw new Error('No download URL received');
        }

        console.log('[play] ✅ Download URL:', downloadUrl.substring(0, 80));

        // ═══ Download Audio Buffer ═══
        console.log('[play] 📥 Downloading audio to buffer...');

        const audioResponse = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': '*/*'
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
        const safeTitle = (videoTitle || 'NEXTY_MINI_Audio')
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
        if (err.response?.status === 401) errorMsg = 'Invalid Tornado API key.';
        else if (err.response?.status === 422) errorMsg = 'Format not supported.';
        else if (err.response?.status === 429) errorMsg = 'Rate limit. Wait.';
        else if (err.response?.status === 402) errorMsg = 'Out of trial credits.';

        try {
            await sock.sendMessage(chatId, { 
                text: `❌ *Play Error*\n\n\`${errorMsg}\`` 
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        } catch (e) {}
    }
}

module.exports = playCommand;
