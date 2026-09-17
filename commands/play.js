/**
 * 🎵 NEXTY MINI — Play Command (RapidAPI)
 * ────────────────────────────────────────
 * Search & download YouTube audio (MP3).
 * 
 * Usage: .play <song name or YouTube URL>
 */

const axios = require('axios');
const yts = require('yt-search');

// ═══ RapidAPI Config ═══
const RAPIDAPI_KEY = '0b29c845famshdce32905d95a2a9p138924jsn6e73c4d0c621';
const RAPIDAPI_HOST = 'youtube-mp36.p.rapidapi.com';

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
        let videoUrl, videoTitle, videoThumb, videoDuration, videoAuthor, videoId = null;

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
            videoId = video.videoId || null;
        }

        // ─── Extract Video ID (Robust) ───
        if (!videoId) {
            const patterns = [
                /(?:youtube\.com\/watch\?v=)([^#\&\?]{11})/,
                /(?:youtu\.be\/)([^#\&\?]{11})/,
                /(?:youtube\.com\/embed\/)([^#\&\?]{11})/,
                /(?:youtube\.com\/shorts\/)([^#\&\?]{11})/,
                /(?:v=)([^#\&\?]{11})/
            ];
            
            for (const pattern of patterns) {
                const match = videoUrl.match(pattern);
                if (match && match[1] && match[1].length === 11) {
                    videoId = match[1];
                    break;
                }
            }
        }

        if (!videoId) {
            throw new Error('Could not extract YouTube video ID');
        }

        console.log(`[play] 📹 Video ID: ${videoId}`);

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
                     `│ ▸ *Engine* : RapidAPI\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Please wait, downloading audio..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // ═══ RapidAPI Call — Get Download URL ═══
        console.log('[play] 🚀 Calling RapidAPI...');

        const rapidAPIHeaders = {
            'x-rapidapi-key': RAPIDAPI_KEY,
            'x-rapidapi-host': RAPIDAPI_HOST,
            'Content-Type': 'application/json'
        };

        const { data } = await axios.get(
            `https://${RAPIDAPI_HOST}/dl`,
            {
                params: { id: videoId },
                headers: rapidAPIHeaders,
                timeout: 120000
            }
        );

        console.log('[play] ✅ RapidAPI response:', JSON.stringify(data).substring(0, 250));

        if (data?.status !== 'ok' && data?.status !== 'processing') {
            throw new Error(data?.msg || 'API returned error');
        }

        let downloadUrl = data?.link;

        if (!downloadUrl) {
            throw new Error('No download link in response');
        }

        console.log('[play] ✅ Initial URL received');

        // ═══════════════════════════════════════════════════════
        //  DOWNLOAD AUDIO WITH RETRY (123tokyo URL expires fast)
        // ═══════════════════════════════════════════════════════
        console.log('[play] 📥 Downloading audio with retry...');

        let audioBuffer = null;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts && !audioBuffer) {
            attempts++;
            try {
                console.log(`[play] 📥 Attempt ${attempts}/${maxAttempts}...`);

                const audioResponse = await axios.get(downloadUrl, {
                    responseType: 'arraybuffer',
                    timeout: 30000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Referer': 'https://www.youtube.com/',
                        'Origin': 'https://www.youtube.com'
                    },
                    maxContentLength: 100 * 1024 * 1024,
                    maxRedirects: 5,
                    transformResponse: [(d) => d]
                });

                const buf = Buffer.from(audioResponse.data);

                if (buf && buf.length > 10240) {
                    audioBuffer = buf;
                    console.log(`[play] ✅ Downloaded: ${buf.length} bytes`);
                    break;
                } else {
                    console.log(`[play] ⚠️ Attempt ${attempts}: ${buf?.length || 0} bytes`);
                }
            } catch (err) {
                console.log(`[play] ❌ Attempt ${attempts} failed: ${err.message}`);
            }

            // If not last attempt, get fresh URL and retry
            if (!audioBuffer && attempts < maxAttempts) {
                try {
                    console.log('[play] 🔄 Getting fresh URL...');
                    const { data: retryData } = await axios.get(
                        `https://${RAPIDAPI_HOST}/dl`,
                        {
                            params: { id: videoId },
                            headers: rapidAPIHeaders,
                            timeout: 60000
                        }
                    );

                    if (retryData?.link) {
                        downloadUrl = retryData.link;
                        console.log('[play] ✅ Fresh URL received');
                    }
                } catch (e) {
                    console.log('[play] ⚠️ Fresh URL failed:', e.message);
                }

                await new Promise(r => setTimeout(r, 1500));
            }
        }

        if (!audioBuffer) {
            throw new Error('Download failed after all retries');
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
        console.error('[play] ❌ Main error:', err.message);

        let errorMsg = err.message;
        if (err.response?.status === 401) errorMsg = 'Invalid RapidAPI key.';
        else if (err.response?.status === 403) errorMsg = 'Access forbidden.';
        else if (err.response?.status === 429) errorMsg = 'Rate limit hit. Wait.';
        else if (err.response?.status === 404) errorMsg = 'Video not found.';
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
