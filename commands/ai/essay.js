/**
 * .essay <topic> — AI writes a structured essay.
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'essay',
    aliases: ['writeessay'],
    description: 'Write a structured essay on a topic',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply('📚 *Essay*\n\nUsage: .essay <topic>\nExample: .essay the importance of clean energy');
        }
        const topic = args.join(' ');
        await reply('📚 *Writing...*');
        const out = await ask({
            system: 'Write a well-structured essay with an introduction, 2-3 body paragraphs, and a conclusion. Keep it under 400 words.',
            user: topic,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`📚 *Essay: ${topic}*\n\n${out}`);
    },
};
