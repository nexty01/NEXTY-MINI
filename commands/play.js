/**
 * 🎵 NEXTY MINI — Play Command
 * ─────────────────────────────
 * Search & download YouTube audio (MP3).
 * Same as .song but with .play trigger.
 * 
 * Usage: .play <song name or YouTube URL>
 */

const axios = require('axios');
const yts = require('yt-search');
const { toAudio } = require('../lib/converter');

const AXIOS_DEFAULTS = {
    timeout: 60000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

async function tryRequest(getter, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
        try {
            return await getter();
        } catch (err) {
            lastError = err;
            if (attempt < attempts) {
                await new Promise(r => setTimeout(r, 1000 * attempt));
            }
        }
    }
    throw lastError;
}

// ═══════════════════════════════════════════════════════════
//  API METHODS (Fallback Chain)
// ═══════════════════════════════════════════════════════════
async function getEliteProTechDownloadByUrl(youtubeUrl) {
    const apiUrl = `https://eliteprotech-apis.zone.id/ytdown?url=${encodeURIComponent(youtubeUrl)}&format=mp3`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.downloadURL) {
        return { download: res.data.downloadURL, title: res.data.title };
    }
    throw new Error('EliteProTech returned no download');
}

async function getYupraDownloadByUrl(youtubeUrl) {
    const apiUrl = `https://api.yupra.my.id/api/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.success && res?.data?.data?.download_url) {
        return {
            download: res.data.data.download_url,
            title: res.data.data.title,
            thumbnail: res.data.data.thumbnail
        };
    }
    throw new Error('Yupra returned no download');
}

async function getOkatsuDownloadByUrl(youtubeUrl) {
    const apiUrl = `https://okatsu-rolezapiiz.vercel.app/downloader/ytmp3?url=${encodeURIComponent(youtubeUrl)}`;
    const res = await tryRequest(() => axios.get(apiUrl, AXIOS_DEFAULTS));
    if (res?.data?.dl) {
        return {
            download: res.data.dl,
            title: res.data.title,
            thumbnail: res.data.thumb
        };
    }
    throw new Error('Okatsu returned no download');
}

// ═══════════════════════════════════════════════════════════
//  MAIN PLAY COMMAND
// ═══════════════════════════════════════════════════════════
async function playCommand(sock, chatId, message, q) {
    try {
        // Loading reactions
        const loadEmojis = ['🎵', '⏳', '📥'];
        for (const emoji of loadEmojis) {
            try {
                await sock.sendMessage(chatId, { react: { text: emoji, key: message.key } });
            } catch (e) {}
        }

        // Get query
        const messageContent = message.message?.ephemeralMessage?.message 
                            || message.message?.viewOnceMessage?.message 
                            || message.message?.viewOnceMessageV2?.message 
                            || message.message;
        const text = (messageContent.conversation 
                   || messageContent.extendedTextMessage?.text 
                   || messageContent.imageMessage?.caption 
                   || messageContent.videoMessage?.caption 
                   || '').trim();

        // Extract query from message (remove .play prefix)
        let query = q;
        if (!query) {
            query = text.replace(/^\.(play|song|music)\s+/i, '').trim();
        }

        if (!query || query.toLowerCase() === '.play') {
            return await sock.sendMessage(chatId, { 
                text: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                      `┃  🎵 *NEXTY MINI PLAY* 🎵        ┃\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                      `╭─「 📝 *USAGE* 」─────────────────\n` +
                      `│ ▸ .play <song name>\n` +
                      `│ ▸ .play <YouTube URL>\n` +
                      `╰──────────────────────────────────\n\n` +
                      `╭─「 💡 *EXAMPLES* 」──────────────\n` +
                      `│ ▸ .play shape of you\n` +
                      `│ ▸ .play https://youtu.be/...\n` +
                      `╰──────────────────────────────────\n\n` +
                      `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                      `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                      `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
            }, { quoted: message });
        }

        // Search YouTube
        let video;
        if (query.includes('youtube.com') || query.includes('youtu.be')) {
            video = { 
                url: query, 
                title: 'YouTube Audio', 
                thumbnail: 'https://i.postimg.cc/y6GV9P3H/file-000000004c307206bc366893b817568c-(1).png' 
            };
        } else {
            const search = await yts(query);
            if (!search || !search.videos.length) {
                return await sock.sendMessage(chatId, { 
                    text: `❌ *No results found for:* \`${query}\`` 
                }, { quoted: message });
            }
            video = search.videos[0];
        }

        // Send info card
        await sock.sendMessage(chatId, {
            image: { url: video.thumbnail },
            caption: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  🎵 *NOW PLAYING* 🎵            ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `╭─「 📀 *TRACK INFO* 」───────────\n` +
                     `│ ▸ *Title*    : ${video.title}\n` +
                     `│ ▸ *Duration* : ${video.timestamp || 'N/A'}\n` +
                     `│ ▸ *Quality*  : MP3 128kbps\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Downloading audio... Please wait..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: message });

        // ═══ Try multiple APIs with fallback ═══
        let audioBuffer;
        let downloadSuccess = false;
        let finalTitle = video.title;

        const apiMethods = [
            { name: 'EliteProTech', method: () => getEliteProTechDownloadByUrl(video.url) },
            { name: 'Yupra', method: () => getYupraDownloadByUrl(video.url) },
            { name: 'Okatsu', method: () => getOkatsuDownloadByUrl(video.url) },
            { name: 'Alya', method: async () => {
                const res = await axios.get(`https://api.alyachan.pro/api/ytmp3?url=${encodeURIComponent(video.url)}&apikey=G7I6X7`, AXIOS_DEFAULTS);
                if (res.data.status && res.data.data.url) return { download: res.data.data.url, title: res.data.data.title };
                throw new Error('Alya failed');
            }},
            { name: 'Vreden', method: async () => {
                const res = await axios.get(`https://api.vreden.my.id/api/ytmp3?url=${encodeURIComponent(video.url)}`, AXIOS_DEFAULTS);
                if (res.data.status && res.data.result.download.url) return { download: res.data.result.download.url, title: res.data.result.metadata.title };
                throw new Error('Vreden failed');
            }}
        ];

        for (const apiMethod of apiMethods) {
            try {
                const audioData = await apiMethod.method();
                const audioUrl = audioData.download;
                finalTitle = audioData.title || video.title;

                if (!audioUrl) continue;

                const audioResponse = await axios.get(audioUrl, {
                    responseType: 'arraybuffer',
                    timeout: 120000,
                    headers: {
                        'User-Agent': 'Mozilla/5.0',
                        'Accept': '*/*'
                    }
                });
                audioBuffer = Buffer.from(audioResponse.data);

                if (audioBuffer && audioBuffer.length > 0) {
                    downloadSuccess = true;
                    console.log(`[play] Success via ${apiMethod.name}`);
                    break;
                }
            } catch (err) {
                console.log(`[play] ${apiMethod.name} failed:`, err.message);
            }
        }

        if (!downloadSuccess) {
            throw new Error('All download sources failed. Try again later.');
        }

        // ═══ Detect format and convert if needed ═══
        const firstBytes = audioBuffer.slice(0, 4).toString('hex');
        let fileExtension = 'mp3';
        if (firstBytes.startsWith('000000') || audioBuffer.slice(4, 8).toString('ascii') === 'ftyp') {
            fileExtension = 'm4a';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'OggS') {
            fileExtension = 'ogg';
        } else if (audioBuffer.toString('ascii', 0, 4) === 'RIFF') {
            fileExtension = 'wav';
        }

        let finalBuffer = audioBuffer;
        if (fileExtension !== 'mp3') {
            try {
                finalBuffer = await toAudio(audioBuffer, fileExtension);
            } catch (convErr) {
                console.log('[play] Convert failed, using original:', convErr.message);
            }
        }

        // ═══ Send audio ═══
        await sock.sendMessage(chatId, {
            audio: finalBuffer,
            mimetype: 'audio/mpeg',
            fileName: `${finalTitle.replace(/[^\w\s-]/g, '')}.mp3`,
            ptt: false
        }, { quoted: message });

        // Success reaction
        try {
            await sock.sendMessage(chatId, { react: { text: '✅', key: message.key } });
        } catch (e) {}

    } catch (err) {
        console.error('[play] Error:', err.message);
        try {
            await sock.sendMessage(chatId, { 
                text: `❌ *Play Error*\n\n${err.message}\n\n_Please try again later._` 
            }, { quoted: message });
            await sock.sendMessage(chatId, { react: { text: '❌', key: message.key } });
        } catch (e) {}
    }
}

// ═══════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════
module.exports = playCommand;
