/**
 * SetSubject Command — Set group name/subject
 * Usage: .setsubject <name>
 */

module.exports = {
    name: 'setsubject',
    aliases: ['setname', 'gname', 'subject'],
    description: 'Set the group name/subject',
    category: 'moderation',
    async execute({ sock, from, reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const subject = args.join(' ');
        if (!subject) {
            return reply(
                `🏷️ *Set Group Name*\n\n` +
                `Usage: .setsubject <name>\n` +
                `Example: .setsubject My Awesome Group`
            );
        }

        try {
            await sock.groupUpdateSubject(from, subject);
            reply(
                `✅ *Group Name Updated*\n\n` +
                `New name: *${subject}*`
            );
        } catch (err) {
            reply('❌ Failed to update group name. Make sure I am an admin!');
        }
    }
};
