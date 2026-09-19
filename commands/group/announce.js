/**
 * Announce Command — Send a formatted group announcement
 * Usage: .announce <message>
 */
module.exports = {
    name: 'announce',
    aliases: ['announcement', 'notice'],
    description: 'Send a group announcement',
    category: 'group',
    async execute({ reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args.length) return reply('📢 Usage: .announce <your announcement here>');
        const text = args.join(' ');
        const now = new Date().toLocaleString('en-US', { hour:'2-digit', minute:'2-digit', month:'short', day:'numeric' });
        reply(
            `📢 *ANNOUNCEMENT*\n` +
            `${'━'.repeat(25)}\n\n` +
            `${text}\n\n` +
            `${'━'.repeat(25)}\n` +
            `🕐 ${now}`
        );
    }
};
