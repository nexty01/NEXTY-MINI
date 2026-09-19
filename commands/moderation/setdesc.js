/**
 * SetDesc Command — Set group description
 * Usage: .setdesc <description>
 */

module.exports = {
    name: 'setdesc',
    aliases: ['setdescription', 'gdesc'],
    description: 'Set the group description',
    category: 'moderation',
    async execute({ sock, from, reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const description = args.join(' ');
        if (!description) {
            return reply(
                `📝 *Set Description*\n\n` +
                `Usage: .setdesc <description>\n` +
                `Example: .setdesc Welcome to our group!`
            );
        }

        try {
            await sock.groupUpdateDescription(from, description);
            reply(
                `✅ *Description Updated*\n\n` +
                `New description:\n${description}`
            );
        } catch (err) {
            reply('❌ Failed to update description. Make sure I am an admin!');
        }
    }
};
