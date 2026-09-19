/**
 * .explain <topic> — AI explains a topic in simple terms (ELI5).
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'explain',
    aliases: ['eli5'],
    description: 'Explain any topic in simple terms',
    category: 'ai',
    async execute({ reply, args, from, sender, isGroup }) {
        if (!args.length) {
            return reply('🧠 *Explain*\n\nUsage: .explain <topic>\nExample: .explain black holes');
        }
        const topic = args.join(' ');
        await reply('🧠 *Explaining...*');
        const out = await ask({
            key: 'explain:' + (isGroup ? from : sender),
            system: 'You are a friendly teacher. Explain the topic clearly and simply, like to a curious beginner. Keep it under 200 words.',
            user: topic,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`🧠 *Explain: ${topic}*\n\n${out}`);
    },
};
