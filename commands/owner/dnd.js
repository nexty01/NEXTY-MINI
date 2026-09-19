/**
 * DND (Do Not Disturb) — Owner command
 *
 * .dnd set I will be back  →  turns DND on. From then on, anyone who
 * @-tags you in a group gets an automatic "Don't tag me — I will be
 * back" style reply.
 *
 * IMPORTANT — trigger condition: this only fires when someone actually
 * @-mentions you (taps/types your contact as a real WhatsApp mention).
 * It is wired into the exact same detection point that already powers
 * .mentionreact / .mentionmessage, which reads contextInfo.mentionedJid —
 * a field WhatsApp only ever populates for a genuine @-tag. Replying to
 * one of your messages (swipe-to-reply / quote) never sets that field,
 * so a reply alone will never trigger DND. That's the "manual tag only,
 * not when they reply to my message" behaviour you asked for.
 *
 * Usage:
 *   .dnd set <message>  — enable, set the away message
 *   .dnd off            — disable (you're back)
 *   .dnd status          — show current setting
 */
'use strict';

const database = require('../../utils/database');

module.exports = {
    name: 'dnd',
    aliases: ['donotdisturb', 'nodisturb'],
    description: "Auto-reply to anyone who @-tags you while you're away",
    usage: '.dnd set <message> | .dnd off | .dnd status',
    category: 'owner',

    async execute({ reply, args, phoneNumber, isOwner }) {
        if (!isOwner) return reply('🔒 Only the bot owner can use this command.');

        const current = database.getDndMode(phoneNumber);
        const action = (args[0] || '').toLowerCase();

        if (!action || action === 'status') {
            return reply(
                `╔══════════════════════════╗\n` +
                `║      🌙 *DND MODE*        ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Status: ${current.enabled ? '✅ ON' : '❌ OFF'}\n` +
                `Message: ${current.message ? `_"${current.message}"_` : '_(not set)_'}\n\n` +
                `*Usage:*\n` +
                `▸ .dnd set <text>  — go offline with this message\n` +
                `▸ .dnd off         — come back online\n` +
                `▸ .dnd status      — show current setting\n\n` +
                `_Only fires on an actual @-tag — replying to your messages never triggers it._`
            );
        }

        if (action === 'off' || action === 'disable') {
            database.setDndMode(phoneNumber, { enabled: false, message: current.message || '' });
            return reply('✅ *DND OFF* — welcome back! Tags will no longer get an auto-reply.');
        }

        if (action === 'clear') {
            database.setDndMode(phoneNumber, { enabled: false, message: '' });
            return reply('🗑️ *DND cleared.*');
        }

        if (action === 'set' || action === 'on') {
            const message = args.slice(1).join(' ').trim();
            if (!message) return reply('❌ Provide a message!\n\nExample: `.dnd set I will be back`');
            database.setDndMode(phoneNumber, { enabled: true, message });
            return reply(
                `🌙 *DND ON*\n\n` +
                `Anyone who tags you now gets:\n` +
                `_"🚫 Don't tag me! ${message}"_`
            );
        }

        return reply('❓ Usage: `.dnd set <message>` | `.dnd off` | `.dnd status`');
    },

    /**
     * handleDndTag — called once per group message from sessionManager.js.
     * Owns all DND trigger logic here (not in sessionManager) so this file
     * is the single place to look when debugging DND specifically.
     *
     * ctx fields (all provided by sessionManager, already LID-resolved):
     *   phoneNumber   — session's own number (DB key)
     *   ownerPhone    — bare digits of the configured owner number
     *   senderPhone   — bare digits of whoever sent this message
     *   mentionedPhones — Set of bare digits explicitly @-tagged in this msg
     *   quotedPhone   — bare digits of the person being replied/quoted (or '')
     */
    async handleDndTag(sock, msg, from, ctx) {
        try {
            const { phoneNumber, ownerPhone, senderPhone, mentionedPhones, quotedPhone, sender } = ctx;

            if (senderPhone === ownerPhone) return; // never trigger on yourself

            const tagged = mentionedPhones.has(ownerPhone) || quotedPhone === ownerPhone;
            if (!tagged) return;

            const dnd = database.getDndMode(phoneNumber);
            if (!dnd?.enabled || !dnd.message) return;

            // Delete the tagging message — needs the bot to be a group admin;
            // best-effort, silently no-ops otherwise.
            await sock.sendMessage(from, { delete: msg.key }).catch(() => {});
            await sock.sendMessage(from, {
                text: `🚫 *Don't tag me!* ${dnd.message}`,
                mentions: [sender],
            }, { quoted: msg }).catch(() => {});
        } catch (err) {
            console.error('[DND]', err.message);
        }
    },
};
