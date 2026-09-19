/**
 * unblock — Unblock a previously blocked WhatsApp contact (owner only).
 *
 * Usage:
 *   .unblock               (reply to a user's message)
 *   .unblock @user         (tag a user)
 *   .unblock 2348012345678 (raw number)
 */

function extractTarget(msg, args, sender) {
    const ctx = msg?.message?.extendedTextMessage?.contextInfo;
    const mentioned = ctx?.mentionedJid?.[0];
    if (mentioned) return mentioned;

    const replied = ctx?.participant;
    if (replied) return replied;

    if (args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num.length >= 6) return `${num}@s.whatsapp.net`;
    }
    return null;
}

module.exports = {
    name: 'unblock',
    aliases: ['unblockcontact'],
    description: 'Unblock a WhatsApp contact (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ sock, msg, args, reply, sender, isOwner }) {
        try {
            if (!isOwner) {
                return reply('🛡️ *Owner Only!*\n\n❌ Only the bot owner can unblock contacts.');
            }

            const target = extractTarget(msg, args, sender);
            if (!target) {
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  ✅ *UNBLOCK COMMAND*     ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `*Usage:*\n` +
                    `▸ .unblock @user\n` +
                    `▸ .unblock (reply to a message)\n` +
                    `▸ .unblock 2348012345678`
                );
            }

            await sock.updateBlockStatus(target, 'unblock');
            const num = target.split('@')[0].split(':')[0];
            return reply(
                `╔══════════════════════════╗\n` +
                `║  ✅ *CONTACT UNBLOCKED*   ║\n` +
                `╚══════════════════════════╝\n\n` +
                `🔓 *+${num}* has been unblocked.`,
                { mentions: [target] }
            );
        } catch (err) {
            console.error('[UNBLOCK]', err);
            return reply(`❌ Failed to unblock: ${err.message}`);
        }
    },
};
