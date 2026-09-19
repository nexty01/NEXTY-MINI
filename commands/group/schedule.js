/**
 * Schedule Command — Schedule a delayed message in the group
 * Usage: .schedule <minutes> <message>
 */
module.exports = {
    name: 'schedule',
    aliases: ['delay', 'timer'],
    description: 'Schedule a message to be sent after X minutes',
    category: 'group',
    async execute({ sock, from, reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (args.length < 2) return reply('⏰ *Schedule Message*\n\nUsage: .schedule <minutes> <message>\nExample: .schedule 5 Meeting starts now!');
        const mins = parseInt(args[0]);
        if (isNaN(mins) || mins < 1 || mins > 1440) return reply('❌ Minutes must be between 1 and 1440 (24 hours).');
        const message = args.slice(1).join(' ');
        const sendTime = new Date(Date.now() + mins * 60000).toLocaleTimeString('en-US', { hour:'2-digit', minute:'2-digit' });
        reply(`⏰ *Message Scheduled!*\n\n📝 "${message}"\n\n🕐 Will be sent in *${mins} minute(s)* (at ~${sendTime})`);
        setTimeout(async () => {
            try { await sock.sendMessage(from, { text: `📢 *Scheduled Message*\n\n${message}` }); }
            catch (e) { console.error('[Schedule]', e); }
        }, mins * 60000);
    }
};
