/**
 * ClearWarn Command — Clear all warnings for a user
 * Usage: .clearwarn @user
 */
const database = require('../../utils/database');
module.exports = {
    name: 'clearwarn',
    aliases: ['warnreset', 'removewarn'],
    description: 'Clear all warnings for a user',
    category: 'admin',
    async execute({ reply, args, from, isGroup, msg }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentioned[0] || (args[0] ? args[0].replace(/[^0-9]/g,'')+'@s.whatsapp.net' : null);
        if (!target) return reply('❌ Usage: .clearwarn @user\nMention the user to clear warnings.');
        database.resetWarnings(from, target);
        reply(`✅ *Warnings Cleared*\n\n👤 @${target.split('@')[0]}'s warnings have been reset to 0.`, { mentions: [target] });
    }
};
