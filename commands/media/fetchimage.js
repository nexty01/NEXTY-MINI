/**
 * Fetch Image Command
 * Usage: .fetchimage <query>
 */

const axios = require("axios");

// Placeholder for API Keys - User should set these up
const SERPAPI_KEY = process.env.SERPAPI_KEY || "YOUR_SERPAPI_KEY";

module.exports = {
    name: "fetchimage",
    aliases: ["imgsearch", "findimg"],
    description: "Searches for images based on a query.",
    category: "media",
    async execute({ sock, msg, from, reply, args }) {
        const query = args.join(" ");
        if (!query) {
            return reply("🖼️ *Image Search*\n\nPlease provide a search query for images.\nExample: .fetchimage cute cats");
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
        await reply("⏳ *Searching for images...* This may take a moment.");

        let imageUrl = null;
        let usedApi = "";

        // --- STAGE 1: SerpApi (Google Images) ---
        if (SERPAPI_KEY !== "YOUR_SERPAPI_KEY") {
            try {
                console.log("[fetchimage] Trying SerpApi (Google Images)...");
                const res = await axios.get("https://serpapi.com/search", {
                    params: {
                        engine: "google_images",
                        q: query,
                        api_key: SERPAPI_KEY,
                    },
                    timeout: 30000
                });

                if (res.data && res.data.images_results && res.data.images_results.length > 0) {
                    imageUrl = res.data.images_results[0].original;
                    usedApi = "SerpApi (Google Images)";
                } else {
                    console.error("[fetchimage] SerpApi returned no image results:", res.data);
                }
            } catch (e) {
                console.error("[fetchimage] SerpApi error:", e.message);
            }
        }

        // --- STAGE 2: Public Image Search API (Example: Some free image search API) ---
        if (!imageUrl) {
            try {
                console.log("[fetchimage] Trying Public Image Search API (hypothetical)...");
                // This is a placeholder. A real public API would be needed here.
                // Example: const res = await axios.get(`https://some-public-image-api.com/search?q=${encodeURIComponent(query)}`);
                // if (res.data && res.data.results && res.data.results.length > 0) {
                //     imageUrl = res.data.results[0].url;
                //     usedApi = "Public Image API";
                // }
                console.log("[fetchimage] No robust public image search API found. Skipping.");
            } catch (e) {
                console.error("[fetchimage] Public Image Search API fallback error:", e.message);
            }
        }

        if (!imageUrl) {
            await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ *ERROR:* All image search engines are currently unavailable or failed to find images.\n\nPossible reasons:\n1. No results for the query.\n2. API limits reached.\n3. Servers are down.");
        }

        await sock.sendMessage(from, {
            image: { url: imageUrl },
            mimetype: "image/jpeg", // Assuming most images will be jpeg or can be sent as such
            caption: `🖼️ *Image Search Result*\n\n🔍 *Query:* ${query}\n🚀 *Engine:* ${usedApi}\n\n> Searched by SUKUNA MD`,
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    },
};
