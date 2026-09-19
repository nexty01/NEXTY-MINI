/**
 * Lowercase Command — Convert text to lowercase
 * Usage: .lower <text>
 */
module.exports = {
    name: 'lower',
    aliases: ['lowercase'],
    description: 'Convert text to lowercase',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) return reply('🔡 *Lowercase*\n\nUsage: .lower <text>\nExample: .lower HELLO WORLD');
        reply(`🔡 *Lowercase*\n\n${args.join(' ').toLowerCase()}`);
    }
};
