/**
 * Reverse Command — Reverse any text
 * Usage: .reverse <text>
 */
module.exports = {
    name: 'reverse',
    aliases: ['backwards', 'rev'],
    description: 'Reverse any text',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) return reply('🔄 *Reverse Text*\n\nUsage: .reverse <text>\nExample: .reverse Hello World');
        const text = args.join(' ');
        const reversed = text.split('').reverse().join('');
        reply(`🔄 *Reverse Text*\n\nOriginal: ${text}\nReversed: *${reversed}*`);
    }
};
