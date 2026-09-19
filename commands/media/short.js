/**
 * URL Shortener Command
 * Usage: .short <URL>
 */

const axios = require("axios");
const { isUrl } = require("../../lib/mediaFetch");

// Placeholder for API Key - User should set this up
const BITLY_API_KEY = process.env.BITLY_API_KEY || "YOUR_BITLY_API_KEY";

module.exports = {
    name: "short",
    aliases: ["shortenurl", "tinyurl"],
    description: "Shortens a given URL.",
    category: "utility",
    async execute({ sock, msg, from, reply, args }) {
        const longUrl = args[0];
        if (!longUrl || !isUrl(longUrl)) {
            return reply(
                "🔗 *URL Shortener*\n\nPlease provide a valid URL to shorten.\nExample: .short https://www.example.com/very/long/url/that/needs/to/be/shortened");
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
        await reply("⏳ *Shortening URL...* This may take a moment.");

        let shortUrl = null;
        let usedApi = "";

        // --- STAGE 1: Bitly API ---
        if (BITLY_API_KEY !== "YOUR_BITLY_API_KEY") {
            try {
                console.log("[short] Trying Bitly API...");
                const res = await axios.post("https://api-ssl.bitly.com/v4/shorten", {
                    long_url: longUrl
                }, {
                    headers: {
                        "Authorization": `Bearer ${BITLY_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 15000
                });

                if (res.data && res.data.link) {
                    shortUrl = res.data.link;
                    usedApi = "Bitly";
                } else {
                    console.error("[short] Bitly API failed or returned no link:", res.data);
                }
            } catch (e) {
                console.error("[short] Bitly API error:", e.message);
            }
        }

        // --- STAGE 2: Public Fallback (e.g., TinyURL, CleanURI, or similar) ---
        if (!shortUrl) {
            try {
                console.log("[short] Trying Public URL Shortener API (TinyURL)...");
                const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(longUrl)}`, {
                    timeout: 15000
                });

                if (res.status === 200 && res.data && res.data.startsWith("http")) {
                    shortUrl = res.data;
                    usedApi = "TinyURL";
                } else {
                    console.error("[short] TinyURL API failed or returned invalid link:", res.data);
                }
            } catch (e) {
                console.error("[short] TinyURL API fallback error:", e.message);
            }
        }

        if (!shortUrl) {
            await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ *ERROR:* All URL shortening engines are currently unavailable or failed.\n\nPossible reasons:\n1. Invalid URL.\n2. API limits reached.\n3. Servers are down.");
        }

        await sock.sendMessage(from, {
            text: `🔗 *URL Shortened*\n\n` +
                  `*Original URL:* ${longUrl}\n` +
                  `*Shortened URL:* ${shortUrl}\n` +
                  `🚀 *Engine:* ${usedApi}\n\n` +
                  `> Shortened by SUKUNA MD`,
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });
    },
};
