/**
 * Lock Command — Lock group (prevent members from sending messages)
 * Usage: .lock
 */

module.exports = {
    name: 'lock',
    aliases: ['gclock', 'grouplock'],
    description: 'Lock the group (only admins can send messages)',
    category: 'moderation',
    async execute({  sock, from, reply, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }


        try {
            await sock.groupSettingUpdate(from, 'announcement');
            reply(
                `🔒 *Group Locked*\n\n` +
                `Only admins can send messages now.\n\n` +
                `Use .unlock to allow everyone to chat.`
            );
        } catch (err) {
            reply('❌ Failed to lock the group. Make sure I am an admin!');
        }
    }
};
