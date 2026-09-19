/**
 * Copilot AI Command
 * Usage: .copilot <prompt>
 */

const { ask } = require("../../utils/smartAI");

module.exports = {
    name: "copilot",
    aliases: ["cpt"],
    description: "Chat with Copilot AI",
    category: "ai",
    async execute({ reply, args, from, sender, isGroup }) {
        if (!args.length) {
            return reply(
                "🤖 *Copilot AI*\n\n" +
                "Usage: .copilot <your question>\n" +
                "Example: .copilot Write a Python function to reverse a string."
            );
        }

        const prompt = args.join(" ");
        const key = "copilot:" + (isGroup ? from : sender);

        try {
            await reply("🤖 *Copilot is assisting...*");
            const response = await ask({
                key,
                system: "You are Copilot, an AI programming assistant. Provide helpful code snippets and explanations.",
                user: prompt,
            });

            if (!response || !response.trim()) {
                return reply("❌ Copilot AI is currently unavailable or returned an empty response. Please try again later.");
            }

            reply(
                "🤖 *Copilot AI*\n\n" +
                `Q: ${prompt}\n\n` +
                `A: ${response}`
            );
        } catch (err) {
            console.error("[copilot]", err.message);
            reply(`❌ Copilot AI service error: ${err.message || "Please try again later."}`);
        }
    },
};
