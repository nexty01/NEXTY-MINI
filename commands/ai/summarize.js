/**
 * .summarize <text> — AI summarizes text (or a quoted message).
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'summarize',
    aliases: ['tldr', 'summary'],
    description: 'Summarize a long piece of text',
    category: 'ai',
    async execute({ reply, args, msg }) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const text = (args.join(' ') || quotedText).trim();
        if (!text) {
            return reply('📝 *Summarize*\n\nUsage: .summarize <text>\nOr reply to a message with .summarize');
        }
        await reply('📝 *Summarizing...*');
        const out = await ask({
            system: 'Summarize the user text into clear, concise bullet points. Keep only the key ideas.',
            user: text,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`📝 *Summary*\n\n${out}`);
    },
};
