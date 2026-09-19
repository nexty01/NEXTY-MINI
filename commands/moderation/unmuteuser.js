/**
 * UnmuteUser Command — Unmute a muted user
 * Usage: .unmuteuser @user or reply to user with .unmuteuser
 */

const database = require('../../utils/database');

module.exports = {
    name: 'unmuteuser',
    aliases: ['unmute', 'userunmute'],
    description: 'Unmute a previously muted user',
    category: 'moderation',
    async execute({  sock, msg, from, reply, args, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }


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
                    `🔊 *Unmute User*\n\n` +
                    `Unmute a previously muted user.\n\n` +
                    `*Usage:*\n` +
                    `• Reply to user: .unmuteuser\n` +
                    `• With mention: .unmuteuser @user`
                );
            }

            const wasMuted = database.isUserMuted(from, targetUser);
            if (!wasMuted) {
                return reply('❌ This user is not muted!');
            }

            database.removeMutedUser(from, targetUser);

            const userNumber = targetUser.split('@')[0];
            reply(
                `🔊 *User Unmuted*\n\n` +
                `👤 User @${userNumber} has been unmuted.\n` +
                `They can now send messages normally.`,
                { mentions: [targetUser] }
            );

        } catch (err) {
            console.error('[UnmuteUser Error]', err);
            reply('❌ An error occurred while unmuting the user.');
        }
    }
};
