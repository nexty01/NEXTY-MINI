/**
 * block — Block a WhatsApp contact at the account level (owner only).
 *
 * Usage:
 *   .block               (reply to a user's message)
 *   .block @user         (tag a user)
 *   .block 2348012345678 (raw number)
 *
 * Uses Baileys `updateBlockStatus(jid, 'block')`.
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
    name: 'block',
    aliases: ['blockcontact'],
    description: "Block a WhatsApp contact (owner only)",
    category: 'owner',
    ownerOnly: true,
    async execute({ sock, msg, args, reply, sender, isOwner }) {
        try {
            if (!isOwner) {
                return reply('🛡️ *Owner Only!*\n\n❌ Only the bot owner can block contacts.');
            }

            const target = extractTarget(msg, args, sender);
            if (!target) {
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  🚫 *BLOCK COMMAND*       ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `*Usage:*\n` +
                    `▸ .block @user\n` +
                    `▸ .block (reply to a message)\n` +
                    `▸ .block 2348012345678`
                );
            }

            await sock.updateBlockStatus(target, 'block');
            const num = target.split('@')[0].split(':')[0];
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🚫 *CONTACT BLOCKED*     ║\n` +
                `╚══════════════════════════╝\n\n` +
                `🔒 *+${num}* has been blocked.\n` +
                `Use *.unblock @user* to undo.`,
                { mentions: [target] }
            );
        } catch (err) {
            console.error('[BLOCK]', err);
            return reply(`❌ Failed to block: ${err.message}`);
        }
    },
};
