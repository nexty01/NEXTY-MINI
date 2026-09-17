/**
 * 📸 NEXTY MINI — Instagram Downloader (yt-dlp + Cookies)
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { promisify } = require('util');
const execAsync = promisify(exec);

async function instaCommand(sock, from, msg, q) {
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
            url = text.replace(/^\.(ig|insta|instagram)\s+/i, '').trim();
        }

        if (!url || !url.includes('instagram.com')) {
            return await sock.sendMessage(from, { 
                text: `❌ *Please provide an Instagram URL.*\n\n*Example:*\n▸ .ig https://www.instagram.com/reel/xxx`
            }, { quoted: msg });
        }

        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        await sock.sendMessage(from, {
            text: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                  `┃  📸 *NEXTY MINI IG DL* 📸      ┃\n` +
                  `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                  `╭─「 🔄 *PROCESSING* 」──────────\n` +
                  `│ ▸ Engine: yt-dlp\n` +
                  `│ ▸ Cookies: ✅ Loaded\n` +
                  `│ ▸ Please wait...\n` +
                  `╰──────────────────────────────────\n\n` +
                  `> _Downloading from Instagram_ ⏳`
        }, { quoted: msg });

        // ─── Cookies setup ───
        let cookiesPath = null;
        const cookiesB64 = process.env.IG_COOKIES_BASE64;

        if (cookiesB64) {
            cookiesPath = path.join(os.tmpdir(), `ig_cookies_${Date.now()}.txt`);
            try {
                fs.writeFileSync(cookiesPath, Buffer.from(cookiesB64, 'base64').toString('utf-8'));
                console.log('[insta] Cookies loaded from env');
            } catch (e) {
                console.error('[insta] Decode failed:', e.message);
                cookiesPath = null;
            }
        } else if (fs.existsSync(path.join(__dirname, '..', 'cookies.txt'))) {
            cookiesPath = path.join(__dirname, '..', 'cookies.txt');
            console.log('[insta] Using local cookies.txt');
        }

        // ─── yt-dlp command ───
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        const outputTemplate = path.join(tempDir, `ig_${timestamp}_%(title)s.%(ext)s`);

        let ytDlpCmd = `yt-dlp --no-playlist --no-warnings --no-check-certificate`;
        
        if (cookiesPath && fs.existsSync(cookiesPath)) {
            ytDlpCmd += ` --cookies "${cookiesPath}"`;
        }
        
        ytDlpCmd += ` -o "${outputTemplate}" "${url}"`;

        console.log('[insta] Running yt-dlp...');

        try {
            await execAsync(ytDlpCmd, {
                timeout: 120000,
                maxBuffer: 50 * 1024 * 1024
            });
        } catch (execErr) {
            console.error('[insta] yt-dlp failed:', execErr.message);
            throw new Error('Download failed. Try another link.');
        }

        // ─── Find files ───
        const files = fs.readdirSync(tempDir)
            .filter(f => f.startsWith(`ig_${timestamp}_`))
            .map(f => path.join(tempDir, f));

        if (files.length === 0) {
            throw new Error('No files downloaded.');
        }

        console.log(`[insta] Found ${files.length} file(s)`);

        // ─── Send files ───
        for (let i = 0; i < files.length; i++) {
            const filePath = files[i];
            const fileBuffer = fs.readFileSync(filePath);
            const ext = path.extname(filePath).toLowerCase();
            const isVideo = ['.mp4', '.mkv', '.webm', '.mov'].includes(ext);

            const caption = `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                            `┃  📸 *NEXTY MINI IG* 📸         ┃\n` +
                            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                            `✅ *Downloaded Successfully*\n` +
                            `▸ Engine: yt-dlp\n` +
                            `▸ Type: ${isVideo ? 'Video 🎬' : 'Photo 🖼️'}\n` +
                            `▸ Item: ${i + 1}/${files.length}\n\n` +
                            `> 👀 *POWERED BY NEXTY MINI*`;

            try {
                if (isVideo) {
                    await sock.sendMessage(from, {
                        video: fileBuffer,
                        mimetype: 'video/mp4',
                        caption
                    }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, {
                        image: fileBuffer,
                        caption
                    }, { quoted: msg });
                }
            } catch (sendErr) {
                console.error(`[insta] Send error:`, sendErr.message);
            }

            try { fs.unlinkSync(filePath); } catch (e) {}
        }

        if (cookiesPath && cookiesPath.includes(os.tmpdir())) {
            try { fs.unlinkSync(cookiesPath); } catch (e) {}
        }

        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

    } catch (err) {
        console.error('[insta] Error:', err.message);
        try {
            await sock.sendMessage(from, { 
                text: `❌ *Instagram Download Error*\n\n\`${err.message}\`\n\n_Please try another link._` 
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
        } catch (e) {}
    }
}

module.exports = instaCommand;
