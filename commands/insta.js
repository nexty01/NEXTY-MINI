/**
 * 📸 NEXTY MINI — Instagram Downloader
 * ─────────────────────────────────────
 * Downloads Instagram Reels, Posts, IGTV, Photos.
 * Multi-API fallback — ek fail ho to doosra try kare.
 * 
 * Usage: .ig <instagram URL>
 *        .insta <instagram URL>
 */

const axios = require('axios');

const AXIOS_DEFAULTS = {
    timeout: 30000,
    headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'application/json, text/plain, */*'
    }
};

// ═══════════════════════════════════════════════════════════
//  API METHODS (Fallback Chain)
// ═══════════════════════════════════════════════════════════

// 1. Vreden (Working)
async function vredenDownload(url) {
    const res = await axios.get(`https://api.vreden.my.id/api/igdl?url=${encodeURIComponent(url)}`, AXIOS_DEFAULTS);
    if (res.data?.status && res.data?.result) {
        const result = res.data.result;
        const mediaArray = result.medias || result.data || (Array.isArray(result) ? result : [result]);
        return mediaArray.map(m => ({
            url: m.url || m.download_url || m.dl,
            isVideo: (m.url || m.download_url || m.dl || '').includes('.mp4') || m.type === 'video'
        }));
    }
    throw new Error('Vreden failed');
}

// 2. Yupra (Working)
async function yupraDownload(url) {
    const res = await axios.get(`https://api.yupra.my.id/api/downloader/instagram?url=${encodeURIComponent(url)}`, AXIOS_DEFAULTS);
    if (res.data?.success && res.data?.data) {
        const media = res.data.data.media || res.data.data;
        const mediaArray = Array.isArray(media) ? media : [media];
        return mediaArray.map(m => ({
            url: m.url || m.download_url,
            isVideo: (m.url || m.download_url || '').includes('.mp4') || m.type === 'video'
        }));
    }
    throw new Error('Yupra failed');
}

// 3. Okatsu (Working)
async function okatsuDownload(url) {
    const res = await axios.get(`https://okatsu-rolezapiiz.vercel.app/downloader/igdl?url=${encodeURIComponent(url)}`, AXIOS_DEFAULTS);
    if (res.data?.result) {
        const result = res.data.result;
        const mediaArray = Array.isArray(result) ? result : [result];
        return mediaArray.map(m => ({
            url: m.url || m.dl || m.download,
            isVideo: (m.url || m.dl || m.download || '').includes('.mp4') || m.type === 'video'
        }));
    }
    throw new Error('Okatsu failed');
}

// 4. Siputzx (Alternative endpoint - /igdl instead of /instagram)
async function siputzxDownload(url) {
    const res = await axios.get(`https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`, AXIOS_DEFAULTS);
    if (res.data?.status && res.data?.data) {
        return res.data.data.map(item => ({
            url: item.url,
            isVideo: item.url.includes('.mp4')
        }));
    }
    throw new Error('Siputzx failed');
}

// 5. Alya (Working - with key)
async function alyaDownload(url) {
    const res = await axios.get(`https://api.alyachan.pro/api/instagram?url=${encodeURIComponent(url)}&apikey=G7I6X7`, AXIOS_DEFAULTS);
    if (res.data?.status && res.data?.data) {
        const media = res.data.data.media || res.data.data;
        const mediaArray = Array.isArray(media) ? media : [media];
        return mediaArray.map(m => ({
            url: m.url || m.download_url,
            isVideo: (m.url || m.download_url || '').includes('.mp4')
        }));
    }
    throw new Error('Alya failed');
}

// 6. Ruhend (Working)
async function ruhendDownload(url) {
    const res = await axios.get(`https://api.ruhendscraper.my.id/instagram?url=${encodeURIComponent(url)}`, AXIOS_DEFAULTS);
    if (res.data?.status && res.data?.data) {
        const media = Array.isArray(res.data.data) ? res.data.data : [res.data.data];
        return media.map(m => ({
            url: m.url || m.download_url,
            isVideo: (m.url || m.download_url || '').includes('.mp4')
        }));
    }
    throw new Error('Ruhend failed');
}

// ═══════════════════════════════════════════════════════════
//  MAIN INSTAGRAM COMMAND
// ═══════════════════════════════════════════════════════════
async function instaCommand(sock, from, msg, q) {
    try {
        // ─── Get URL from q or msg text ───
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

        // ─── Validate URL ───
        if (!url || !url.includes('instagram.com')) {
            return await sock.sendMessage(from, { 
                text: `❌ *Please provide an Instagram URL.*\n\n` +
                      `*Examples:*\n` +
                      `▸ .ig https://www.instagram.com/reel/xxx\n` +
                      `▸ .insta https://www.instagram.com/p/xxx`
            }, { quoted: msg });
        }

        // ─── Loading reaction ───
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // ─── Processing message ───
        await sock.sendMessage(from, {
            text: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                  `┃  📸 *NEXTY MINI IG DL* 📸      ┃\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                  `╭─「 🔄 *PROCESSING* 」──────────\n` +
                  `│ ▸ Fetching from multiple\n` +
                  `│    sources...\n` +
                  `│ ▸ Please wait...\n` +
                  `╰──────────────────────────────────\n\n` +
                  `> _Downloading from Instagram_ ⏳`
        }, { quoted: msg });

        // ═══ Try multiple APIs with fallback ═══
        let mediaItems = null;
        let usedAPI = '';

        const apiMethods = [
            { name: 'Vreden', method: () => vredenDownload(url) },
            { name: 'Yupra', method: () => yupraDownload(url) },
            { name: 'Okatsu', method: () => okatsuDownload(url) },
            { name: 'Siputzx', method: () => siputzxDownload(url) },
            { name: 'Alya', method: () => alyaDownload(url) },
            { name: 'Ruhend', method: () => ruhendDownload(url) }
        ];

        for (const apiMethod of apiMethods) {
            try {
                console.log(`[insta] Trying ${apiMethod.name}...`);
                const result = await apiMethod.method();
                if (result && result.length > 0 && result[0].url) {
                    mediaItems = result;
                    usedAPI = apiMethod.name;
                    console.log(`[insta] ✅ Success via ${apiMethod.name} (${result.length} items)`);
                    break;
                }
            } catch (err) {
                console.log(`[insta] ❌ ${apiMethod.name} failed: ${err.message}`);
            }
        }

        if (!mediaItems || mediaItems.length === 0) {
            throw new Error('All download sources failed. Please try again later.');
        }

        // ═══ Send each media item ═══
        let successCount = 0;
        for (let i = 0; i < mediaItems.length; i++) {
            const item = mediaItems[i];
            
            try {
                const caption = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                                `┃  📸 *NEXTY MINI IG* 📸         ┃\n` +
                                `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                                `✅ *Downloaded Successfully*\n` +
                                `▸ Source: ${usedAPI}\n` +
                                `▸ Type: ${item.isVideo ? 'Video 🎬' : 'Photo 🖼️'}\n` +
                                `▸ Item: ${i + 1}/${mediaItems.length}\n\n` +
                                `> 👀 *POWERED BY NEXTY MINI*`;

                if (item.isVideo) {
                    await sock.sendMessage(from, {
                        video: { url: item.url },
                        mimetype: 'video/mp4',
                        caption
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        image: { url: item.url },
                        caption
                    }, { quoted: msg });
                }
                successCount++;
            } catch (dlErr) {
                console.log(`[insta] Item ${i + 1} failed: ${dlErr.message}`);
            }
        }

        // ═══ Success/Error reaction ═══
        if (successCount > 0) {
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } else {
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
            await sock.sendMessage(from, { 
                text: `❌ *Failed to download media*\n\nPlease try again with another link.` 
            }, { quoted: msg });
        }

    } catch (err) {
        console.error('[insta] Error:', err.message);
        try {
            await sock.sendMessage(from, { 
                text: `❌ *Instagram Download Error*\n\n\`${err.message}\`\n\n_Please try again later._` 
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
        } catch (e) {}
    }
}

module.exports = instaCommand;
