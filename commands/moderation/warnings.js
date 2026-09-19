/**
 * Warnings Command — Check user warnings
 * Usage: .warnings @user
 */

module.exports = {
    name: 'warnings',
    aliases: ['warns', 'checkwarns'],
    description: 'Check warnings of a user',
    category: 'moderation',
    async execute({ sock, msg, from, reply, args, isGroup, database }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        let targetUser = mentioned[0] || quotedParticipant;
        
        if (!targetUser && args.length > 0) {
            const input = args[0].replace(/[^0-9]/g, '');
            if (input) targetUser = input + '@s.whatsapp.net';
        }
        
        if (!targetUser) {
            targetUser = msg.key.participant || msg.key.remoteJid;
        }

        const warningCount = database.getWarnings(from, targetUser);
        const userNumber = targetUser.split('@')[0];

        reply(
            `⚠️ *Warning Status*\n\n` +
            `👤 User: @${userNumber}\n` +
            `⚠️ Warnings: ${warningCount}/3\n` +
            `📊 Status: ${warningCount === 0 ? '✅ Clean' : warningCount === 1 ? '⚠️ Caution' : warningCount === 2 ? '🔴 Warning' : '🚫 Critical'}`,
            { mentions: [targetUser] }
        );
    }
};
