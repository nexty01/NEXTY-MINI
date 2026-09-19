/**
 * Horror AI Command
 * Usage: .horror <prompt>
 */

const axios = require('axios');

module.exports = {
    name: 'horror',
    description: 'Generate a horror story or theme',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const prompt = args.join(' ');
        if (!prompt) {
            return reply('👻 Please provide a theme for the horror AI.\nExample: .horror haunted house');
        }

        try {
            const res = await axios.get(`https://apis.prexzyvilla.site/ai/aichat?prompt=Write a short horror story about: ${encodeURIComponent(prompt)}`);
            const data = res.data;
            const text = data.reply || data.response || data.result || '...';

            reply(`👻 *Horror Story:* \n\n${text}`);
        } catch (err) {
            console.error('[horror]', err.message);
            reply('❌ Horror AI is currently unavailable.');
        }
    }
};
