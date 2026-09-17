/**
 * 🎬 NEXTY MINI — YouTube Video Downloader (Tornado API)
 * ──────────────────────────────────────────────────────
 * Search by name OR direct URL — auto downloads.
 * 
 * Usage: .video I Wanna Be Your Slave
 *        .video https://youtu.be/xxx
 */

const axios = require('axios');
const yts = require('yt-search');

// ═══ Tornado API Config ═══
const TORNADO_API_KEY = 'sk_tornadoapi_trial_YOUR_NEW_KEY_HERE'; // ← Nayi key yahan
const TORNADO_API_URL = 'https://api.tornadoapi.io/jobs';
const R2_BASE_URL = 'https://r2.tornadoapi.io'; // ← Base URL confirm karo

async function videoCommand(sock, from, msg, q) {
    try {
        // ─── Get Query ───
        let query = q;

        if (!query) {
            const messageContent = msg.message?.ephemeralMessage?.message 
                                || msg.message?.viewOnceMessage?.message 
                                || msg.message?.viewOnceMessageV2?.message 
                                || msg.message;
            const text = (messageContent.conversation 
                       || messageContent.extendedTextMessage?.text 
                       || messageContent.imageMessage?.caption 
                       || '').trim();
            query = text.replace(/^\.(video|yt|youtube|ytmp4|play)\s+/i, '').trim();
        }

        if (!query) {
            return await sock.sendMessage(from, { 
                text: `❌ *Please provide a video name or YouTube URL.*\n\n` +
                      `*Examples:*\n` +
                      `▸ .video I Wanna Be Your Slave\n` +
                      `▸ .video https://youtu.be/xxx`
            }, { quoted: msg });
        }

        // ─── Loading reaction ───
        await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

        // ─── Search YouTube ───
        console.log(`[video] 🔍 Searching YouTube: ${query}`);

        const ytRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//i;
        let videoUrl, videoTitle, videoThumb, videoDuration, videoViews, videoAuthor;

        if (ytRegex.test(query)) {
            // Direct URL
            videoUrl = query;
            videoTitle = 'YouTube Video';
            const match = videoUrl.match(/(?:v=|\/)([0-9A-Za-z_-]{11})/);
            if (match) {
                videoThumb = `https://i.ytimg.com/vi/${match[1]}/hqdefault.jpg`;
            }
        } else {
            // Search by name
            const search = await yts(query);
            const video = search.videos[0];

            if (!video) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
                return await sock.sendMessage(from, { 
                    text: `❌ *No results found for:* \`${query}\`` 
                }, { quoted: msg });
            }

            videoUrl = video.url;
            videoTitle = video.title;
            videoThumb = video.thumbnail;
            videoDuration = video.timestamp;
            videoViews = video.views;
            videoAuthor = video.author?.name || 'Unknown';
        }

        // ─── Send Info Card ───
        await sock.sendMessage(from, {
            image: { url: videoThumb },
            caption: `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  🎬 *NEXTY MINI VIDEO* 🎬      ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                     `╭─「 📀 *NOW DOWNLOADING* 」──────\n` +
                     `│ ▸ *Title*  : ${videoTitle.substring(0, 45)}${videoTitle.length > 45 ? '...' : ''}\n` +
                     `${videoDuration ? `│ ▸ *Duration* : ${videoDuration}\n` : ''}` +
                     `${videoViews ? `│ ▸ *Views*    : ${videoViews}\n` : ''}` +
                     `${videoAuthor ? `│ ▸ *Author*   : ${videoAuthor}\n` : ''}` +
                     `│ ▸ *Engine* : Tornado API\n` +
                     `╰──────────────────────────────────\n\n` +
                     `⏳ _Please wait, downloading..._\n\n` +
                     `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                     `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
                     `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`
        }, { quoted: msg });

        // ═══ Tornado API Call ═══
        console.log('[video] 🚀 Calling Tornado API...');

        const { data } = await axios.post(
            TORNADO_API_URL,
            {
                url: videoUrl,
                format: 'mp4',
                max_resolution: '720'
            },
            {
                headers: {
                    'x-api-key': TORNADO_API_KEY,
                    'Content-Type': 'application/json'
                },
                timeout: 180000
            }
        );

        console.log('[video] ✅ Response:', JSON.stringify(data).substring(0, 300));

        // ═══ Extract Download URL ═══
        let downloadUrl = null;
        let jobStatus = null;

        // Format 1: jobs array (aapki API ka response)
        if (data?.jobs && Array.isArray(data.jobs) && data.jobs.length > 0) {
            const job = data.jobs[0];
            jobStatus = job.status;

            if (job.status === 'Completed') {
                // Try s3_url first
                if (job.s3_url) {
                    downloadUrl = job.s3_url;
                } 
                // Try s3_key → build URL
                else if (job.s3_key) {
                    downloadUrl = `${R2_BASE_URL}/${job.s3_key}`;
                }
            }
        }
        // Format 2: direct s3_url
        else if (data?.s3_url) {
            downloadUrl = data.s3_url;
        }
        // Format 3: nested data.s3_url
        else if (data?.data?.s3_url) {
            downloadUrl = data.data.s3_url;
        }
        // Format 4: job_id (poll)
        else if (data?.job_id || data?.id) {
            const jobId = data.job_id || data.id;
            console.log('[video] ⏳ Polling job:', jobId);

            for (let i = 0; i < 60; i++) {
                await new Promise(r => setTimeout(r, 3000));

                try {
                    const jobRes = await axios.get(
                        `https://api.tornadoapi.io/jobs/${jobId}`,
                        {
                            headers: { 'x-api-key': TORNADO_API_KEY },
                            timeout: 30000
                        }
                    );

                    console.log(`[video] Poll ${i + 1}: ${jobRes.data?.status || jobRes.data?.jobs?.[0]?.status}`);

                    // Check jobs array response
                    if (jobRes.data?.jobs?.[0]) {
                        const j = jobRes.data.jobs[0];
                        if (j.status === 'Completed') {
                            if (j.s3_url) downloadUrl = j.s3_url;
                            else if (j.s3_key) downloadUrl = `${R2_BASE_URL}/${j.s3_key}`;
                            break;
                        }
                        if (j.status === 'Failed' || j.status === 'Error') {
                            throw new Error('Job failed: ' + (j.error || 'unknown'));
                        }
                    }
                    // Direct response
                    else if (jobRes.data?.s3_url) {
                        downloadUrl = jobRes.data.s3_url;
                        break;
                    } else if (jobRes.data?.status === 'Completed') {
                        if (jobRes.data.s3_key) {
                            downloadUrl = `${R2_BASE_URL}/${jobRes.data.s3_key}`;
                            break;
                        }
                    }
                } catch (pollErr) {
                    console.log('[video] Poll error:', pollErr.message);
                }
            }
        }

        if (!downloadUrl) {
            throw new Error('No download URL received. Check logs.');
        }

        console.log('[video] ✅ Download URL:', downloadUrl.substring(0, 80) + '...');

        // ═══ Send Video ═══
        const botCaption = 
            `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
            `┃  🎬 *NEXTY MINI VIDEO* 🎬      ┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            `✅ *Downloaded Successfully*\n` +
            `▸ Engine: Tornado API\n` +
            `▸ Type: Video 🎬\n` +
            `▸ Quality: 720p HD\n` +
            `${videoTitle ? `▸ Title: ${videoTitle.substring(0, 50)}${videoTitle.length > 50 ? '...' : ''}\n` : ''}` +
            `\n> 👀 *POWERED BY NEXTY MINI*`;

        await sock.sendMessage(from, {
            video: { url: downloadUrl },
            mimetype: 'video/mp4',
            caption: botCaption
        }, { quoted: msg });

        // ═══ Success reaction ═══
        await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });

        console.log('[video] ✅ Sent successfully');

    } catch (err) {
        console.error('[video] ❌ Error:', err.message);

        let errorMsg = err.message;

        if (err.response) {
            console.error('[video] Status:', err.response.status);
            console.error('[video] Data:', JSON.stringify(err.response.data).substring(0, 300));

            if (err.response.status === 401) {
                errorMsg = 'Invalid API key. Please update.';
            } else if (err.response.status === 429) {
                errorMsg = 'Rate limit. Wait a minute.';
            } else if (err.response.status === 402) {
                errorMsg = 'Out of trial credits.';
            } else if (err.response.status === 400) {
                errorMsg = err.response.data?.reason || 'Invalid request.';
            } else {
                errorMsg = `API Error ${err.response.status}`;
            }
        }

        try {
            await sock.sendMessage(from, { 
                text: `❌ *Video Download Error*\n\n\`${errorMsg}\`` 
            }, { quoted: msg });
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
        } catch (e) {}
    }
}

module.exports = videoCommand;
