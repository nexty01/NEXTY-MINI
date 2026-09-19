/**
 * SlowMode Command — Toggle slow mode (message delay)
 * Usage: .slowmode <seconds> | .slowmode off
 */
const database = require('../../utils/database');
module.exports = {
    name: 'slowmode',
    aliases: ['cooldown', 'msgdelay'],
    description: 'Set a message cooldown for group members',
    category: 'admin',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args.length) return reply('🐢 *Slow Mode*\n\nUsage:\n• .slowmode 30 → Set 30 second cooldown\n• .slowmode off → Disable slow mode');
        if (args[0].toLowerCase() === 'off') {
            database.setGroupData(from, 'slowmode', 0);
            return reply('✅ *Slow Mode Disabled*\n\nMembers can now message freely.');
        }
        const secs = parseInt(args[0]);
        if (isNaN(secs) || secs < 1 || secs > 3600) return reply('❌ Enter seconds between 1 and 3600.');
        database.setGroupData(from, 'slowmode', secs);
        reply(`🐢 *Slow Mode Enabled*\n\n⏱️ Cooldown: *${secs} seconds*\n\nMembers must wait ${secs}s between messages.`);
    }
};
