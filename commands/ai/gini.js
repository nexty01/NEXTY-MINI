/**
 * Gini AI Command
 * Usage: .gini <prompt>
 */

const axios = require('axios');

module.exports = {
    name: 'gini',
    description: 'Chat with Gini AI',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const prompt = args.join(' ');
        if (!prompt) {
            return reply('🤖 Please provide a prompt for Gini AI.\nExample: .gini Tell me a joke.');
        }

        try {
            const res = await axios.get(`https://apis.prexzyvilla.site/ai/aichat?prompt=${encodeURIComponent(prompt)}`);
            const data = res.data;
            const text = data.reply || data.response || data.result || '...';

            reply(text);
        } catch (err) {
            console.error('[gini]', err.message);
            reply('❌ Gini AI is currently unavailable.');
        }
    }
};
