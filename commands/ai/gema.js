/**
 * Gema AI Command (Gemini)
 * Usage: .gema <prompt>
 */

const axios = require('axios');

module.exports = {
    name: 'gema',
    aliases: ['gemini'],
    description: 'Chat with Gemini AI',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const prompt = args.join(' ');
        if (!prompt) {
            return reply('🤖 Please provide a prompt for Gema AI.\nExample: .gema What is quantum physics?');
        }

        try {
            await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

            const res = await axios.get(`https://prexzyapis.com/ai/gemini?prompt=${encodeURIComponent(prompt)}`);
            const data = res.data;
            
            // Handle various possible response fields
            const text = data.result || data.reply || data.response || data.data?.response || '...';

            reply(text);
            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[gema]', err.message);
            await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
            reply('❌ Gema AI is currently unavailable.');
        }
    }
};
