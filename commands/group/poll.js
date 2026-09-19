/**
 * Poll Command — Create a poll in the group
 * Usage: .poll <question> | <option1> | <option2> | ...
 */

module.exports = {
    name: 'poll',
    aliases: ['vote', 'survey'],
    description: 'Create a poll in the group',
    category: 'group',
    async execute({ sock, msg, from, reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const input = args.join(' ');
        const parts = input.split('|').map(p => p.trim());
        
        if (parts.length < 3) {
            return reply(
                `📊 *Poll Creator*\n\n` +
                `Usage: .poll <question> | <option1> | <option2> | ...\n` +
                `Example: .poll Best programming language? | JavaScript | Python | Java`
            );
        }

        const question = parts[0];
        const options = parts.slice(1);

        if (options.length > 10) {
            return reply('❌ Maximum 10 options allowed.');
        }

        try {
            const pollOptions = options.map((opt, idx) => ({
                optionName: opt,
                optionIndex: idx
            }));

            await sock.sendMessage(from, {
                poll: {
                    name: question,
                    values: options,
                    selectableCount: 1
                }
            }, { quoted: msg });

        } catch (err) {
            reply('❌ Failed to create poll. Please try again.');
        }
    }
};
