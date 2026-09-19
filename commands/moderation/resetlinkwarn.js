/**
 * ResetLinkWarn Command — Reset antilink warnings for a user
 * Usage: .resetlinkwarn @user or reply to user
 */

const database = require('../../utils/database');

module.exports = {
    name: 'resetlinkwarn',
    aliases: ['resetlinkwarning', 'clearlinkwarn'],
    description: 'Reset antilink warnings for a user',
    category: 'moderation',
    async execute({ sock, msg, from, reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        try {
            // Get target user from reply or mention
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
            
            let targetUser = mentioned[0] || quotedParticipant;
            
            if (!targetUser && args.length > 0) {
                const input = args[0].replace(/[^0-9]/g, '');
                if (input) targetUser = input + '@s.whatsapp.net';
            }
            
            if (!targetUser) {
                return reply(
                    `🔄 *Reset Link Warning*\n\n` +
                    `Reset antilink warnings for a user.\n\n` +
                    `*Usage:*\n` +
                    `• Reply to user: .resetlinkwarn\n` +
                    `• With mention: .resetlinkwarn @user`
                );
            }

            const warnings = database.getAntiLinkWarnings(from, targetUser);
            
            if (warnings === 0) {
                return reply('❌ This user has no antilink warnings to reset.');
            }

            database.resetAntiLinkWarnings(from, targetUser);

            const userNumber = targetUser.split('@')[0];
            reply(
                `✅ *Warnings Reset*\n\n` +
                `Antilink warnings for @${userNumber} have been reset.\n` +
                `Previous warnings: ${warnings}`,
                { mentions: [targetUser] }
            );

        } catch (err) {
            console.error('[ResetLinkWarn Error]', err);
            reply('❌ An error occurred while resetting warnings.');
        }
    }
};
