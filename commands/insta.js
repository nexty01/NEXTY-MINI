/**
 * 📸 NEXTY MINI — Instagram Downloader (yt-dlp)
 * ─────────────────────────────────────────────
 * Uses yt-dlp binary for 100% reliable downloads.
 * FREE forever. No API key. No rate limits.
 * 
 * Usage: .ig <instagram URL>
 *        .insta <instagram URL>
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
                  `│ ▸ Using yt-dlp engine\n` +
                  `│ ▸ 100% reliable\n` +
                  `│ ▸ Please wait...\n` +
                  `╰──────────────────────────────────\n\n` +
                  `> _Downloading from Instagram_ ⏳`
        }, { quoted: msg });

        // ─── Temp path ───
        const tempDir = os.tmpdir();
        const timestamp = Date.now();
        const outputTemplate = path.join(tempDir, `ig_${timestamp}_%(title)s.%(ext)s`);

        // ─── yt-dlp command ───
        const ytDlpCmd = `yt-dlp --no-playlist --no-warnings --user-agent "Mozilla/5.0 (Windows NT 10.0; Win64; x64)" -o "${outputTemplate}" "${url}"`;

        console.log('[insta] Running:', ytDlpCmd);

        try {
            const { stdout, stderr } = await execAsync(ytDlpCmd, {
                timeout: 90000,
                maxBuffer: 50 * 1024 * 1024
            });
            console.log('[insta] yt-dlp stdout:', stdout);
            if (stderr) console.log('[insta] stderr:', stderr);
        } catch (execErr) {
            console.error('[insta] yt-dlp failed:', execErr.message);
            throw new Error('yt-dlp failed. Instagram may require login for this post.');
        }

        // ─── Find files ───
        const files = fs.readdirSync(tempDir)
            .filter(f => f.startsWith(`ig_${timestamp}_`))
            .map(f => path.join(tempDir, f));

        if (files.length === 0) {
            throw new Error('No files downloaded. Try a public post.');
        }

        console.log(`[insta] Found ${files.length} file(s)`);

        // ─── Send each file ───
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
                console.error(`[insta] Send item ${i + 1} failed:`, sendErr.message);
            }

            // Cleanup
            try { fs.unlinkSync(filePath); } catch (e) {}
        }

        // ─── Success reaction ───
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
