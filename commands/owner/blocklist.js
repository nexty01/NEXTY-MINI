/**
 * Blocklist Command — View bots block list
 * Usage: .blocklist
 */
const database = require('../../utils/database');
module.exports = {
    name: 'blocklist',
    aliases: ['banned', 'bannedlist'],
    description: 'View all users banned from bot (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ reply }) {
        const banned = database.getBannedUsers ? database.getBannedUsers() : [];
        if (!banned || !banned.length) return reply('📋 *Bot Block List*\n\nNo users are currently banned from the bot.');
        const list = banned.map((u, i) => `${i+1}. +${u.replace('@s.whatsapp.net','')}`).join('\n');
        reply(`🚫 *Bot Block List*\n\n${list}\n\nTotal banned: *${banned.length}*\nUse .unban <number> to unban.`);
    }
};
