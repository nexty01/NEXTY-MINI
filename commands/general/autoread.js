/**
 * autoread — Automatically mark every incoming message as read.
 *
 * Works in ALL chats:
 *   • Group messages  (the group chat bubble shows double-blue tick)
 *   • Private / DM    (sender's chat bubble shows double-blue tick)
 *
 * Usage:
 *   .autoread         → show current status
 *   .autoread on      → enable
 *   .autoread off     → disable
 *
 * Owner-only — visible only to the bot owner.
 */

'use strict';

const database = require('../../utils/database');

module.exports = {
    name:        'autoread',
    aliases:     ['autoreadmsg', 'readall', 'readmessages'],
    description: 'Auto-mark every incoming message as read (groups + DMs)',
    usage:       '.autoread [on|off]',
    category:    'general',
    ownerOnly:   true,

    async execute({ sock, msg, from, args, reply, phoneNumber }) {
        // phoneNumber = the paired bot number (session owner)
        // Fall back to sock.user?.id if not injected
        const pn = phoneNumber
            || (sock.user?.id || '').split(':')[0].split('@')[0].replace(/\D/g, '');

        if (!pn) return reply('❌ Could not identify session — try again.');

        const sub = (args[0] || '').toLowerCase();

        // ── Show current status ──────────────────────────────────────────────
        if (!sub) {
            const current = database.getAutoRead(pn);
            return reply(
                `📩 *Auto-Read*\n\n` +
                `Status: ${current ? '✅ *ON*' : '❌ *OFF*'}\n\n` +
                `• When *ON*  — every incoming message (group & DM) is automatically\n` +
                `  marked as read the moment it arrives. Senders see double-blue ticks.\n\n` +
                `• When *OFF* — normal behaviour; messages are only marked read when\n` +
                `  you (or the bot) explicitly open the chat.\n\n` +
                `*Toggle:* \`.autoread on\` / \`.autoread off\``
            );
        }

        // ── Toggle ───────────────────────────────────────────────────────────
        if (sub === 'on' || sub === 'enable' || sub === '1' || sub === 'true') {
            database.setAutoRead(pn, true);
            return reply(
                `✅ *Auto-Read Enabled*\n\n` +
                `Every incoming message in *groups* and *DMs* will now be\n` +
                `automatically marked as read.\n\n` +
                `Senders will see *double-blue ticks* (👁️ read receipts) immediately.\n\n` +
                `Use \`.autoread off\` to disable.`
            );
        }

        if (sub === 'off' || sub === 'disable' || sub === '0' || sub === 'false') {
            database.setAutoRead(pn, false);
            return reply(
                `❌ *Auto-Read Disabled*\n\n` +
                `Messages will no longer be auto-marked as read.\n\n` +
                `Use \`.autoread on\` to re-enable.`
            );
        }

        // ── Unknown arg ──────────────────────────────────────────────────────
        return reply(
            `⚠️ *Unknown option:* \`${args[0]}\`\n\n` +
            `Usage:\n` +
            `• \`.autoread\`      → show status\n` +
            `• \`.autoread on\`   → enable\n` +
            `• \`.autoread off\`  → disable`
        );
    },
};
