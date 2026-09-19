/**
 * .rewrite <text> — AI paraphrases / rewrites text more clearly.
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'rewrite',
    aliases: ['paraphrase', 'reword'],
    description: 'Rewrite text to be clearer and more polished',
    category: 'ai',
    async execute({ reply, args, msg }) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const text = (args.join(' ') || quotedText).trim();
        if (!text) {
            return reply('✍️ *Rewrite*\n\nUsage: .rewrite <text>\nOr reply to a message with .rewrite');
        }
        await reply('✍️ *Rewriting...*');
        const out = await ask({
            system: 'Rewrite the user text so it is clear, natural, and well-written. Keep the same meaning and language. Return only the rewritten text.',
            user: text,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`✍️ *Rewritten*\n\n${out}`);
    },
};
