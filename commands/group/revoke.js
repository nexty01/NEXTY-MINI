/**
 * Revoke Command — Revoke group invite link
 * Usage: .revoke
 */

module.exports = {
    name: 'revoke',
    aliases: ['revokelink', 'resetlink'],
    description: 'Revoke the group invite link',
    category: 'group',
    async execute({ sock, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        try {
            const groupMetadata = await sock.groupMetadata(from);
            const botId = sock.user.id.split(':')[0] + '@s.whatsapp.net';
            const botParticipant = groupMetadata.participants.find(p => p.id.includes(botId.split('@')[0]));
            const isBotAdmin = botParticipant && (botParticipant.admin === 'admin' || botParticipant.admin === 'superadmin');
            
            if (!isBotAdmin) return reply('🤖 I need to be an admin to revoke the link!');

            await sock.groupRevokeInvite(from);
            
            reply(
                `🔄 *Link Revoked*\n\n` +
                `The old invite link has been revoked.\n` +
                `Use .link to get the new invite link.`
            );
        } catch (err) {
            reply('❌ Failed to revoke link. Make sure I am an admin!');
        }
    }
};
