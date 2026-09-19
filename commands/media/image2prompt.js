/**
 * Image to Prompt Command
 * Usage: .image2prompt [reply to image] or .image2prompt [image URL]
 */

const axios = require("axios");
const { isUrl } = require("../../lib/mediaFetch"); // Assuming a utility for URL check

// Placeholder for API Keys - User should set these up
const MAGNIFIC_API_KEY = process.env.MAGNIFIC_API_KEY || "YOUR_MAGNIFIC_API_KEY";
const NOVITA_API_KEY = process.env.NOVITA_API_KEY || "YOUR_NOVITA_API_KEY";

module.exports = {
    name: "image2prompt",
    aliases: ["i2p", "caption"],
    description: "Generates a text prompt from an image.",
    category: "ai",
    async execute({ sock, msg, from, reply, quoted, args }) {
        let imageUrl = null;

        if (quoted && quoted.image) {
            // Assuming quoted.download() returns a buffer, which needs to be uploaded or base64 encoded for most APIs
            // For simplicity, let's assume we can get a direct URL if the bot hosts images, or we'll need an upload step.
            // For now, if it's a quoted image, we'll need to upload it or use a base64 approach.
            // For this example, let's assume a direct URL is preferred for external APIs.
            // A more robust solution would involve uploading the image to a temporary hosting service.
            return reply("🖼️ *Image to Prompt*\n\nReplying to an image is not yet supported directly for external APIs. Please provide an image URL.");
        } else if (args[0] && isUrl(args[0])) {
            imageUrl = args[0];
        } else {
            return reply("🖼️ *Image to Prompt*\n\nPlease provide an image URL to generate a prompt from.");
        }

        if (!imageUrl) {
            return reply("❌ Could not retrieve image URL. Please try again.");
        }

        await sock.sendMessage(from, { react: { text: "⏳", key: msg.key } });
        await reply("⏳ *Generating prompt...* This may take a moment.");

        let generatedPrompt = null;
        let usedApi = "";

        // --- STAGE 1: Magnific API ---
        if (MAGNIFIC_API_KEY !== "YOUR_MAGNIFIC_API_KEY") {
            try {
                console.log("[image2prompt] Trying Magnific API...");
                const res = await axios.post("https://api.magnific.com/v1/image-to-prompt", {
                    image_url: imageUrl,
                }, {
                    headers: {
                        "Authorization": `Bearer ${MAGNIFIC_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 30000
                });

                if (res.data && res.data.prompt) {
                    generatedPrompt = res.data.prompt;
                    usedApi = "Magnific API";
                } else {
                    console.error("[image2prompt] Magnific API returned no prompt:", res.data);
                }
            } catch (e) {
                console.error("[image2prompt] Magnific API error:", e.message);
            }
        }

        // --- STAGE 2: Novita.ai API ---
        if (!generatedPrompt && NOVITA_API_KEY !== "YOUR_NOVITA_API_KEY") {
            try {
                console.log("[image2prompt] Trying Novita.ai API...");
                const res = await axios.post("https://api.novita.ai/v2/image-to-prompt", {
                    image_url: imageUrl,
                }, {
                    headers: {
                        "Authorization": `Bearer ${NOVITA_API_KEY}`,
                        "Content-Type": "application/json"
                    },
                    timeout: 30000
                });

                if (res.data && res.data.data && res.data.data.prompt) {
                    generatedPrompt = res.data.data.prompt;
                    usedApi = "Novita.ai API";
                } else {
                    console.error("[image2prompt] Novita.ai API returned no prompt:", res.data);
                }
            } catch (e) {
                console.error("[image2prompt] Novita.ai API error:", e.message);
            }
        }

        // --- STAGE 3: Public Fallback (Example: imageprompt.org - if it had a direct API) ---
        // As imageprompt.org seems to be a web interface, a direct API call might not be available without scraping or a dedicated API.
        // For a true fallback, we'd need another API or a custom solution.
        // For demonstration, let's assume a hypothetical public API.
        if (!generatedPrompt) {
            try {
                console.log("[image2prompt] Trying hypothetical Public Image2Prompt API...");
                // This is a placeholder. A real public API would be needed here.
                // Example: const res = await axios.get(`https://some-public-i2p-api.com/generate?url=${encodeURIComponent(imageUrl)}`);
                // if (res.data && res.data.prompt) {
                //     generatedPrompt = res.data.prompt;
                //     usedApi = "Public I2P API";
                // }
                console.log("[image2prompt] No robust public fallback API found for image2prompt. Skipping.");
            } catch (e) {
                console.error("[image2prompt] Public I2P API fallback error:", e.message);
            }
        }

        if (!generatedPrompt) {
            await sock.sendMessage(from, { react: { text: "❌", key: msg.key } });
            return reply("❌ *ERROR:* All image to prompt engines are currently unavailable or failed.\n\nPossible reasons:\n1. Invalid image URL.\n2. API limits reached.\n3. Servers are down.");
        }

        await sock.sendMessage(from, {
            text: `🖼️ *Image to Prompt*\n\n✨ *Generated Prompt:* ${generatedPrompt}\n🚀 *Engine:* ${usedApi}\n\n> Processed by SUKUNA MD`,
        }, { quoted: msg });

        await sock.sendMessage(from, { react: { text: "✅", key: msg.key } });

    },
};
