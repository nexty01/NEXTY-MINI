/**
 * GroupList Command — List all groups bot is in
 * Usage: .grouplist
 */
module.exports = {
    name: 'grouplist',
    aliases: ['mygroups', 'listgroups'],
    description: 'List all groups the bot is currently in (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ sock, reply }) {
        try {
            const groups = await sock.groupFetchAllParticipating();
            const list = Object.values(groups);
            if (!list.length) return reply('📋 Bot is not in any groups.');
            const formatted = list.slice(0,30).map((g,i) => `${i+1}. *${g.subject}*\n   👥 ${g.participants.length} members`).join('\n\n');
            reply(`📋 *Bot Groups* (${list.length} total)\n\n${formatted}${list.length > 30 ? `\n\n_...and ${list.length-30} more_` : ''}`);
        } catch (e) { reply('❌ Failed to fetch group list: ' + e.message); }
    }
};
