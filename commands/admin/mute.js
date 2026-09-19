const database = require('../../utils/database');

module.exports = {
    name: 'mute',
    aliases: ['silence'],
    description: 'Mute the group (only admins can send)',
    category: 'admin',
    async execute({  sock, reply, args, from, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }

        const action = args[0]?.toLowerCase();

        if (!action || !['on', 'off'].includes(action)) {
            const group = database.getGroup(from);
            return reply(`🔇 *Mute Settings*\n\nStatus: ${group.mute ? '✅ Muted' : '🔊 Unmuted'}\n\nUsage:\n• \`.mute on\`\n• \`.mute off\``);
        }

        try {
            const setting = action === 'on' ? 'announcement' : 'not_announcement';
            await sock.groupSettingUpdate(from, setting);
            database.setGroup(from, 'mute', action === 'on');
            reply(action === 'on' ? '🔇 Group has been *muted*! Only admins can send messages.' : '🔊 Group has been *unmuted*!');
        } catch (err) {
            reply(`❌ Failed: ${err.message}`);
        }
    }
};
