/**
 * AntiURL Command — Block URL/link messages from non-admins
 * Usage: .antiurl on | .antiurl off
 */
const database = require('../../utils/database');
module.exports = {
    name: 'antiurl',
    aliases: ['nourl', 'blockurl'],
    description: 'Block non-admins from sending URLs in the group',
    category: 'moderation',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const state = args[0]?.toLowerCase();
        if (!state || !['on','off'].includes(state)) {
            const current = database.getGroupData(from, 'antiurl');
            return reply(`🔗 *Anti-URL*\n\nStatus: ${current ? '✅ Active' : '❌ Inactive'}\n\nUsage: .antiurl on/off\n\nPrevents non-admins from sending links (different from antilink which only catches WhatsApp group invites).`);
        }
        const enabled = state === 'on';
        database.setGroupData(from, 'antiurl', enabled);
        reply(`🔗 *Anti-URL ${enabled ? 'Enabled ✅' : 'Disabled ❌'}*\n\n${enabled ? 'Non-admins cannot send URLs or links.' : 'URL filter has been disabled.'}`);
    }
};
