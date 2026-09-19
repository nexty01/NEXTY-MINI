/**
 * VoteKick Command — Vote to kick a user
 * Usage: .votekick @user
 */

const voteKicks = new Map();

module.exports = {
    name: 'votekick',
    aliases: ['vkick', 'votek'],
    description: 'Start a vote to kick a user',
    category: 'group',
    async execute({ sock, msg, from, reply, args, isGroup }) {
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
                `🗳️ *Vote Kick*\n\n` +
                `Usage: .votekick @user\n` +
                `Or reply to a user with .votekick`
            );
        }

        try {
            const groupMetadata = await sock.groupMetadata(from);
            const participants = groupMetadata.participants;
            
            // Check if target is admin
            const targetParticipant = participants.find(p => p.id === targetUser);
            if (targetParticipant && (targetParticipant.admin === 'admin' || targetParticipant.admin === 'superadmin')) {
                return reply('❌ Cannot vote to kick an admin!');
            }

            const requiredVotes = Math.ceil(participants.length / 3);
            const voteKey = `${from}_${targetUser}`;
            
            if (!voteKicks.has(voteKey)) {
                voteKicks.set(voteKey, new Set());
            }
            
            const votes = voteKicks.get(voteKey);
            const voter = msg.key.participant || msg.key.remoteJid;
            
            if (votes.has(voter)) {
                return reply('❌ You have already voted!');
            }
            
            votes.add(voter);
            
            const userNumber = targetUser.split('@')[0];
            
            if (votes.size >= requiredVotes) {
                await sock.groupParticipantsUpdate(from, [targetUser], 'remove');
                voteKicks.delete(voteKey);
                reply(
                    `🚫 *Vote Kick Successful*\n\n` +
                    `@${userNumber} has been kicked from the group.\n` +
                    `Votes: ${votes.size}/${requiredVotes}`,
                    { mentions: [targetUser] }
                );
            } else {
                reply(
                    `🗳️ *Vote Kick*\n\n` +
                    `Target: @${userNumber}\n` +
                    `Votes: ${votes.size}/${requiredVotes}\n\n` +
                    `Reply with .votekick @${userNumber} to vote!`,
                    { mentions: [targetUser] }
                );
            }
        } catch (err) {
            reply('❌ Failed to process vote kick.');
        }
    }
};
