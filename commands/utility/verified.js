/**
 * .verified — WhatsApp Business Verified Blue Tick Toggle
 * When ON: Every outgoing message includes secureMetaServiceLabel
 * This triggers the biz binary node that shows the verified blue tick
 *
 * Usage:
 *   .verified on    — Activate
 *   .verified off   — Deactivate
 *
 * Note: Works best with WhatsApp Business accounts
 */
module.exports = {
    name: 'verified',
    aliases: ['bluetick', 'verify', 'blueverified'],
    description: 'Toggle WhatsApp Business verified blue tick on/off',
    usage: '.verified on | .verified off',
    category: 'utility',
    async execute({ reply, args, isOwner }) {
        if (!isOwner) {
            return reply('❌ *Owner only!*');
        }

        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on' || sub === 'activate' || sub === 'true') {
            global.__sukunaVerified = true;
            return reply(
                `╔══════════════════════════╗\n` +
                `║  ✅ *VERIFIED BADGE*      ║\n` +
                `║       *ACTIVATED*         ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Outgoing messages will include the *verified business attributes*.\n\n` +
                `⚠️ _Best with WhatsApp Business accounts_\n\n` +
                `Use *.verified off* to stop.`
            );
        }

        if (sub === 'off' || sub === 'deactivate' || sub === 'false') {
            global.__sukunaVerified = false;
            return reply(
                `╔══════════════════════════╗\n` +
                `║  ✅ *VERIFIED BADGE*      ║\n` +
                `║      *DEACTIVATED*        ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Messages are back to normal.`
            );
        }

        // Show status
        const status = global.__sukunaVerified ? '🟢 ACTIVE' : '🔴 INACTIVE';
        return reply(
            `╔══════════════════════════╗\n` +
            `║  ✅ *VERIFIED BADGE*      ║\n` +
            `║    *STATUS:* ${status}    ║\n` +
            `╚══════════════════════════╝\n\n` +
            `*Usage:*\n` +
            `▸ .verified on  — Activate\n` +
            `▸ .verified off — Deactivate`
        );
    }
};
