/**
 * .grammar <text> — AI corrects spelling & grammar.
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'grammar',
    aliases: ['fixgrammar', 'grammarfix'],
    description: 'Fix spelling and grammar in text',
    category: 'ai',
    async execute({ reply, args, msg }) {
        const quoted = msg.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
        const text = (args.join(' ') || quotedText).trim();
        if (!text) {
            return reply('🔤 *Grammar Fix*\n\nUsage: .grammar <text>\nOr reply to a message with .grammar');
        }
        await reply('🔤 *Checking...*');
        const out = await ask({
            system: 'Correct all spelling and grammar mistakes in the user text. Keep the original meaning and language. Return only the corrected text, no explanations.',
            user: text,
            remember: false,
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`🔤 *Corrected*\n\n${out}`);
    },
};
