/**
 * AntiNSFW Command — Toggle NSFW content protection
 * Usage: .antinsfw on | .antinsfw off
 */
const database = require('../../utils/database');
module.exports = {
    name: 'antinsfw',
    aliases: ['nonsfw', 'safemode'],
    description: 'Toggle NSFW content filtering in the group',
    category: 'moderation',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const state = args[0]?.toLowerCase();
        if (!state || !['on','off'].includes(state)) {
            const current = database.getGroupData(from, 'antinsfw');
            return reply(`🔞 *Anti-NSFW*\n\nStatus: ${current ? '✅ Active' : '❌ Inactive'}\n\nUsage: .antinsfw on/off`);
        }
        const enabled = state === 'on';
        database.setGroupData(from, 'antinsfw', enabled);
        reply(`🔞 *Anti-NSFW ${enabled ? 'Enabled ✅' : 'Disabled ❌'}*\n\n${enabled ? '🛡️ NSFW images/videos will be deleted automatically.' : 'NSFW filter has been turned off.'}`);
    }
};
