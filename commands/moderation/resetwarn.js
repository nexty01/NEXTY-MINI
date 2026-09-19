/**
 * ResetWarn Command — Reset user warnings
 * Usage: .resetwarn @user
 */

module.exports = {
    name: 'resetwarn',
    aliases: ['resetwarnings', 'clearwarns'],
    description: 'Reset warnings of a user',
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
            return reply(
                `🔄 *Reset Warnings*\n\n` +
                `Usage:\n` +
                `• .resetwarn @user\n` +
                `• .resetwarn (reply to user)`
            );
        }

        database.resetWarnings(from, targetUser);
        const userNumber = targetUser.split('@')[0];

        reply(
            `✅ *Warnings Reset*\n\n` +
            `👤 User @${userNumber}'s warnings have been cleared.`,
            { mentions: [targetUser] }
        );
    }
};
