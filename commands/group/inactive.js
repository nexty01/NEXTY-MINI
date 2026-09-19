/**
 * Inactive Command — Warn about inactive member tracking
 * Usage: .inactive
 */
module.exports = {
    name: 'inactive',
    aliases: ['lurkers', 'silent'],
    description: 'Display a reminder about inactive members',
    category: 'group',
    async execute({ sock, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        try {
            const meta = await sock.groupMetadata(from);
            const nonAdmins = meta.participants.filter(p => !p.admin);
            reply(
                `👻 *Inactive Members Notice*\n\n` +
                `📊 This group has *${meta.participants.length}* total members\n` +
                `👑 Admins: *${meta.participants.filter(p=>p.admin).length}*\n` +
                `👤 Regular Members: *${nonAdmins.length}*\n\n` +
                `📢 If you've been lurking, now is a great time to say hi! 👋\n\n` +
                `_Inactive member removal is at admin discretion._`
            );
        } catch { reply('❌ Failed to fetch member data.'); }
    }
};
