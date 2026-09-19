/**
 * .poem <topic> — AI writes a poem.
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'poem',
    aliases: ['writepoem'],
    description: 'Write a poem about anything',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply('📜 *Poem*\n\nUsage: .poem <topic>\nExample: .poem the ocean at night');
        }
        const topic = args.join(' ');
        await reply('📜 *Writing...*');
        const out = await ask({
            system: 'You are a talented poet. Write a short, evocative poem (max 16 lines) about the given topic.',
            user: topic,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`📜 *Poem: ${topic}*\n\n${out}`);
    },
};
