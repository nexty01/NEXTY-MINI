/**
 * AI Models Command
 * Usage: .aimodels
 */

const { getProviderInfo } = require("../../utils/smartAI");

module.exports = {
    name: "aimodels",
    aliases: ["listai", "aiprovider"],
    description: "Lists the active AI provider and its fallback chain.",
    category: "ai",
    async execute({ reply }) {
        try {
            const info = getProviderInfo();
            const chainStatus = info.chain.length ? info.chain.join(" → ") : "pollinations (keyless fallback)";

            await reply(
                "🧠 *AI Models & Providers*\n\n" +
                `*Current Preferred Provider:* ${info.provider.toUpperCase()}\n` +
                `*API Key Status:* ${info.key ? "Configured" : "Not Configured (using environment/default)"}\n` +
                `*Active Fallback Chain:* ${chainStatus}\n\n` +
                "_The bot intelligently switches between providers to ensure maximum uptime and performance._"
            );
        } catch (err) {
            console.error("[aimodels]", err.message);
            reply(`❌ Failed to retrieve AI provider information: ${err.message || "Please try again later."}`);
        }
    },
};
