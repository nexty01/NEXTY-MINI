/**
 * Blacklist Command — Add a word to the group blacklist
 * Usage: .blacklist <word>
 */
const database = require('../../utils/database');
module.exports = {
    name: 'blacklist',
    aliases: ['addblacklist', 'badword'],
    description: 'Add a word to the group blacklist filter',
    category: 'moderation',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args.length) return reply('🚫 Usage: .blacklist <word>\nExample: .blacklist badword');
        const word = args[0].toLowerCase();
        const list = database.getGroupData(from, 'blacklist') || [];
        if (list.includes(word)) return reply(`⚠️ "*${word}*" is already blacklisted.`);
        list.push(word);
        database.setGroupData(from, 'blacklist', list);
        reply(`🚫 *Word Blacklisted!*\n\n"*${word}*" added to the filter.\nMessages containing this word will be deleted.\n\nTotal blacklisted: *${list.length}*`);
    }
};
