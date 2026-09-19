/**
 * Unblacklist Command — Remove a word from the group blacklist
 * Usage: .unblacklist <word>
 */
const database = require('../../utils/database');
module.exports = {
    name: 'unblacklist',
    aliases: ['removeblacklist', 'delbadword'],
    description: 'Remove a word from the group blacklist',
    category: 'moderation',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args.length) return reply('✅ Usage: .unblacklist <word>');
        const word = args[0].toLowerCase();
        let list = database.getGroupData(from, 'blacklist') || [];
        if (!list.includes(word)) return reply(`❌ "*${word}*" is not in the blacklist.`);
        list = list.filter(w => w !== word);
        database.setGroupData(from, 'blacklist', list);
        reply(`✅ *Word Removed!*\n\n"*${word}*" removed from the blacklist.\nRemaining blacklisted words: *${list.length}*`);
    }
};
