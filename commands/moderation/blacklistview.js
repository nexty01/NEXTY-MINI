/**
 * BlacklistView Command — View all blacklisted words
 * Usage: .blacklistview
 */
const database = require('../../utils/database');
module.exports = {
    name: 'blacklistview',
    aliases: ['viewblacklist', 'listblacklist'],
    description: 'View all blacklisted words in the group',
    category: 'moderation',
    async execute({ reply, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const list = database.getGroupData(from, 'blacklist') || [];
        if (!list.length) return reply('📋 No words are blacklisted in this group.\n\nAdd words with: .blacklist <word>');
        const words = list.map((w,i) => `${i+1}. \`${w}\``).join('\n');
        reply(`🚫 *Blacklisted Words* (${list.length})\n\n${words}\n\nRemove with: .unblacklist <word>`);
    }
};
