/**
 * Story AI Command
 * Usage: .story <topic>
 */

const axios = require('axios');

module.exports = {
    name: 'story',
    description: 'Generate a short story',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const topic = args.join(' ');
        if (!topic) {
            return reply('📖 Please provide a topic for the story.\nExample: .story a brave knight');
        }

        try {
            const res = await axios.get(`https://apis.prexzyvilla.site/ai/aichat?prompt=Write a creative short story about: ${encodeURIComponent(topic)}`);
            const data = res.data;
            const text = data.reply || data.response || data.result || '...';

            reply(`📖 *Story:* \n\n${text}`);
        } catch (err) {
            console.error('[story]', err.message);
            reply('❌ Story AI is currently unavailable.');
        }
    }
};
