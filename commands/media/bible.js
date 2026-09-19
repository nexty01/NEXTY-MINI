/**
 * Bible Command
 * Usage: .bible <book chapter:verse>
 */

const axios = require('axios');

module.exports = {
    name: 'bible',
    description: 'Get a verse from the Bible',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const query = args.join(' ');
        if (!query) {
            return reply('📖 Please provide a book, chapter, and verse.\nExample: .bible John 3:16');
        }

        try {
            const res = await axios.get(`https://bible-api.com/${encodeURIComponent(query)}`);
            const data = res.data;

            const caption = `📖 *Bible Verse: ${data.reference}*\n\n` +
                `"${data.text.trim()}"\n\n` +
                `📜 *Translation:* ${data.translation_name}`;

            reply(caption);
        } catch (err) {
            console.error('[bible]', err.message);
            reply('❌ Verse not found or API error.');
        }
    }
};
