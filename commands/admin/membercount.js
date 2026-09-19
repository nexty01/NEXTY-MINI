/**
 * MemberCount Command — Show total member count
 * Usage: .membercount
 */
module.exports = {
    name: 'membercount',
    aliases: ['members', 'count'],
    description: 'Show the total number of group members',
    category: 'admin',
    async execute({ sock, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        try {
            const meta = await sock.groupMetadata(from);
            const total = meta.participants.length;
            const admins = meta.participants.filter(p => p.admin).length;
            const regular = total - admins;
            reply(
                `👥 *Group Members*\n\n` +
                `📊 Total: *${total}*\n` +
                `👑 Admins: *${admins}*\n` +
                `👤 Members: *${regular}*\n\n` +
                `📋 Group: *${meta.subject}*`
            );
        } catch (e) { reply('❌ Failed to fetch member count.'); }
    }
};
