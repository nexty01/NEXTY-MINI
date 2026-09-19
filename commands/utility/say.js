/**
 * Say Command — Make the bot say something
 * Usage: .say <text>
 */

module.exports = {
    name: 'say',
    aliases: ['speak', 'echo'],
    description: 'Make the bot repeat your message',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply('Usage: .say <message>');
        }

        const text = args.join(' ');
        reply(text);
    }
};
