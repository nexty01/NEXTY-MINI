/**
 * Mode Command — Toggle bot mode (maintenance/normal/vip)
 * Usage: .mode normal | .mode maintenance | .mode vip
 */
const database = require('../../utils/database');
module.exports = {
    name: 'mode',
    aliases: ['botmode', 'setmode'],
    description: 'Set bot operation mode (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ reply, args }) {
        const modes = ['normal','maintenance','vip'];
        const current = database.getBotData ? database.getBotData('mode') || 'normal' : 'normal';
        if (!args.length || !modes.includes(args[0].toLowerCase())) {
            return reply(`⚙️ *Bot Mode*\n\nCurrent: *${current}*\n\nModes:\n• normal — All users can use bot\n• maintenance — Only owner can use bot\n• vip — Only sudo/owner can use bot\n\nUsage: .mode <normal/maintenance/vip>`);
        }
        const newMode = args[0].toLowerCase();
        if (database.setBotData) database.setBotData('mode', newMode);
        const modeEmoji = { normal:'✅', maintenance:'🔧', vip:'👑' };
        reply(`${modeEmoji[newMode]} *Bot Mode Changed*\n\nMode: *${newMode.toUpperCase()}*\n\n${newMode === 'maintenance' ? '🔧 Only owner can use commands.' : newMode === 'vip' ? '👑 Only sudo/owner can use commands.' : '✅ All users can use commands.'}`);
    }
};
