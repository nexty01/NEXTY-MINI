/**
 * AntiForward Command — Toggle anti-forwarded message protection
 * Usage: .antiforward on | .antiforward off
 */
const database = require('../../utils/database');
module.exports = {
    name: 'antiforward',
    aliases: ['noforward', 'antifwd'],
    description: 'Toggle deletion of forwarded messages in the group',
    category: 'moderation',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const state = args[0]?.toLowerCase();
        if (!state || !['on','off'].includes(state)) return reply('📨 *Anti-Forward*\n\nUsage: .antiforward on/off\n\nWhen ON, all forwarded messages will be deleted.');
        const enabled = state === 'on';
        database.setGroupData(from, 'antiforward', enabled);
        reply(`📨 *Anti-Forward ${enabled ? 'Enabled ✅' : 'Disabled ❌'}*\n\n${enabled ? 'Forwarded messages will now be automatically deleted.' : 'Forwarded messages are now allowed.'}`);
    }
};
