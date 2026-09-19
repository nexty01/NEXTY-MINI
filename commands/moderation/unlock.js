/**
 * Unlock Command — Unlock group (allow all members to send messages)
 * Usage: .unlock
 */

module.exports = {
    name: 'unlock',
    aliases: ['gcunlock', 'groupunlock'],
    description: 'Unlock the group (everyone can send messages)',
    category: 'moderation',
    async execute({  sock, from, reply, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }


        try {
            await sock.groupSettingUpdate(from, 'not_announcement');
            reply(
                `🔓 *Group Unlocked*\n\n` +
                `Everyone can now send messages.`
            );
        } catch (err) {
            reply('❌ Failed to unlock the group. Make sure I am an admin!');
        }
    }
};
