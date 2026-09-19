/**
 * Universal Downloader Command
 * Usage: .unidownload <URL>
 */

const axios = require("axios");
const { isUrl } = require("../../lib/mediaFetch");

module.exports = {
    name: "unidownload",
    aliases: ["dl", "universal"],
    description: "Downloads media from various platforms using a URL.",
    category: "media",
    async execute({ sock, msg, from, reply, args }) {
        const url = args[0];
        if (!url || !isUrl(url)) {
            return reply("🌐 *Universal Downloader*\n\nPlease provide a valid URL to download media.\nExample: .unidownload https://www.youtube.com/watch?v=dQw4w9WgXcQ");
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
        await reply("⏳ *Attempting to download media...* This may take a moment.");

        let mediaUrl = null;
        let usedApi = "";

        // --- STAGE 1: Maher-Zubair All-in-One Downloader API ---
        try {
            console.log("[unidownload] Trying Maher-Zubair API...");
            const res = await axios.get(`https://api.maher-zubair.tech/download/allinone?url=${encodeURIComponent(url)}`, {
                timeout: 60000 // Increased timeout for downloads
            });

            if (res.data && res.data.status === 200 && res.data.result && res.data.result.url) {
                mediaUrl = res.data.result.url;
                usedApi = "Maher-Zubair All-in-One";
            } else {
                console.error("[unidownload] Maher-Zubair API failed or returned no direct URL:", res.data);
            }
        } catch (e) {
            console.error("[unidownload] Maher-Zubair API error:", e.message);
        }

        // --- STAGE 2: Prexzy API (Hypothetical, if available) ---
        if (!mediaUrl) {
            try {
                console.log("[unidownload] Trying Prexzy API fallback (hypothetical)...");
                // Placeholder for a Prexzy universal downloader API if one exists and is robust.
                // Example: const res = await axios.get(`https://prexzyapis.com/download/universal?url=${encodeURIComponent(url)}`);
                // if (res.data && res.data.url) {
                //     mediaUrl = res.data.url;
                //     usedApi = "Prexzy Universal Downloader";
                // }
                console.log("[unidownload] No robust Prexzy API found for universal download. Skipping.");
            } catch (e) {
                console.error("[unidownload] Prexzy API fallback error:", e.message);
            }
        }

        // --- FINAL DELIVERY ---
        if (!mediaUrl) {
            await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ *ERROR:* All download engines are currently unavailable or failed to process the URL.\n\nPossible reasons:\n1. Invalid or unsupported URL.\n2. API limits reached.\n3. Servers are down.");
        }

        // Determine media type for sendMessage
        let messageOptions = { caption: `🌐 *Download Complete*\n\n🔗 *Source:* ${url}\n🚀 *Engine:* ${usedApi}\n\n> Downloaded by SUKUNA MD` };
        if (mediaUrl.match(/\.(mp4|mov|avi|wmv|flv|webm)$/i)) {
            messageOptions.video = { url: mediaUrl };
            messageOptions.mimetype = "video/mp4";
        } else if (mediaUrl.match(/\.(jpg|jpeg|png|gif|webp)$/i)) {
            messageOptions.image = { url: mediaUrl };
            messageOptions.mimetype = "image/jpeg";
        } else if (mediaUrl.match(/\.(mp3|wav|ogg|aac)$/i)) {
            messageOptions.audio = { url: mediaUrl };
            messageOptions.mimetype = "audio/mpeg";
        } else {
            // Fallback to sending as document if type cannot be determined
            messageOptions.document = { url: mediaUrl };
            messageOptions.fileName = `downloaded_media.${mediaUrl.split(".").pop() || "file"}`;
        }

        await sock.sendMessage(from, messageOptions, { quoted: msg });
        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    },
};
