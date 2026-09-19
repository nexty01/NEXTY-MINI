/**
 * .ideas <topic> — Brainstorm creative ideas with AI.
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'ideas',
    aliases: ['brainstorm'],
    description: 'Brainstorm creative ideas about a topic',
    category: 'ai',
    async execute({ reply, args, from, sender, isGroup }) {
        if (!args.length) {
            return reply('💡 *Brainstorm*\n\nUsage: .ideas <topic>\nExample: .ideas youtube channel about cooking');
        }
        const topic = args.join(' ');
        await reply('💡 *Brainstorming...*');
        const out = await ask({
            key: 'ideas:' + (isGroup ? from : sender),
            system: 'You are a creative brainstorming assistant. Give a concise, numbered list of 7 original, practical ideas. No preamble.',
            user: `Brainstorm ideas for: ${topic}`,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`💡 *Ideas: ${topic}*\n\n${out}`);
    },
};
