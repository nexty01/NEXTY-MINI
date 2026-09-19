/**
 * Uppercase Command — Convert text to uppercase
 * Usage: .upper <text>
 */
module.exports = {
    name: 'upper',
    aliases: ['uppercase', 'caps'],
    description: 'Convert text to UPPERCASE',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) return reply('🔠 *Uppercase*\n\nUsage: .upper <text>\nExample: .upper hello world');
        reply(`🔠 *Uppercase*\n\n${args.join(' ').toUpperCase()}`);
    }
};
