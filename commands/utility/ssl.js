/**
 * .ssl — Meta Secure Service Label Toggle
 * When ON: Every outgoing message includes secureMetaServiceLabel
 * This shows "This business used a secure service from Meta…"
 *
 * Usage:
 *   .ssl on    — Activate
 *   .ssl off   — Deactivate
 *
 * Note: This intentionally does NOT use the original .ss name so it does
 * not clash with the bot's built-in website-screenshot command.
 */
module.exports = {
    name: 'ssl',
    aliases: ['secureservice', 'securelabel', 'secureservicelabel', 'metaSecure'],
    description: 'Toggle the Meta Secure Service Label on/off',
    usage: '.ssl on | .ssl off',
    category: 'utility',
    async execute({ reply, args, isOwner }) {
        if (!isOwner) {
            return reply('❌ *Owner only!*');
        }

        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on' || sub === 'activate' || sub === 'true') {
            global.__sukunaSS = true;
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🔐 *SECURE SERVICE*      ║\n` +
                `║       *ACTIVATED*         ║\n` +
                `╚══════════════════════════╝\n\n` +
                `All messages will now show the\n` +
                `*Meta Secure Service* label.\n\n` +
                `Use *.ssl off* to stop.`
            );
        }

        if (sub === 'off' || sub === 'deactivate' || sub === 'false') {
            global.__sukunaSS = false;
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🔐 *SECURE SERVICE*      ║\n` +
                `║      *DEACTIVATED*        ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Messages are back to normal.`
            );
        }

        // Show status
        const status = global.__sukunaSS ? '🟢 ACTIVE' : '🔴 INACTIVE';
        return reply(
            `╔══════════════════════════╗\n` +
            `║  🔐 *SECURE SERVICE*      ║\n` +
            `║    *STATUS:* ${status}    ║\n` +
            `╚══════════════════════════╝\n\n` +
            `*Usage:*\n` +
            `▸ .ssl on  — Activate\n` +
            `▸ .ssl off — Deactivate`
        );
    }
};
