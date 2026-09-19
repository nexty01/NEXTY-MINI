/**
 * SetSudo Command — Grant a user sudo access so they can use the bot even in private mode.
 *
 * Usage (any of these work):
 *   .setsudo               — reply to the person's message
 *   .setsudo @tag          — tag the person
 *   .setsudo 2349012345678 — their phone number directly
 *   .setsudo list          — list all current sudo users
 *
 * Only the bot owner can run this command.
 */

'use strict';

/**
 * Extract the best JID from any message context.
 * Handles all Baileys message types: text, image, video, quoted replies, group, etc.
 */
function resolveTargetJid(msg, args) {
    // 1. Quoted / reply-to message (works for all message types)
    const ctx =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo ||
        msg.message?.videoMessage?.contextInfo ||
        msg.message?.audioMessage?.contextInfo ||
        msg.message?.stickerMessage?.contextInfo ||
        msg.message?.buttonsResponseMessage?.contextInfo ||
        msg.message?.listResponseMessage?.contextInfo ||
        null;

    if (ctx?.participant) return normalise(ctx.participant);
    if (ctx?.remoteJid && !ctx.remoteJid.endsWith('@g.us')) return normalise(ctx.remoteJid);

    // 2. @mention in any message type
    const mentions =
        ctx?.mentionedJid ||
        msg.message?.extendedTextMessage?.contextInfo?.mentionedJid ||
        [];
    if (mentions?.length > 0) return normalise(mentions[0]);

    // 3. Plain number argument (with or without country code)
    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 7) return `${num}@s.whatsapp.net`;
    }

    return null;
}

/**
 * Normalise a JID to its bare form: strip device suffix and ensure @s.whatsapp.net
 * E.g. "2348012345678:12@s.whatsapp.net" → "2348012345678@s.whatsapp.net"
 */
function normalise(jid) {
    if (!jid) return null;
    // Strip device ID suffix (":N")
    const base = jid.split(':')[0];
    if (base.includes('@')) return base;
    return base + '@s.whatsapp.net';
}

module.exports = {
    name:        'setsudo',
    aliases:     ['addsudo', 'sudo', 'sudoadd'],
    description: 'Grant a user sudo access — they can use bot commands even in private mode',
    usage:       '.setsudo (reply / @tag / number / list)',
    category:    'owner',

    async execute({ sock, msg, from, args, reply, database, phoneNumber, isOwner }) {
        if (!isOwner) {
            return reply('🔒 *This command is for the bot owner only.*');
        }

        // ── LIST MODE ─────────────────────────────────────────────────────────
        const sub = (args[0] || '').toLowerCase();
        if (sub === 'list' || sub === 'ls' || sub === 'show') {
            const list = database.getSudoUsers(phoneNumber);
            if (!list.length) {
                return reply(
                    `📋 *No sudo users set.*\n\n` +
                    `_Use .setsudo to add one._`
                );
            }
            const lines = list.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
            return await sock.sendMessage(from, {
                text: `📋 *Sudo Users* (${list.length})\n${lines}\n\n_.unsetsudo to remove_`,
                mentions: list
            }, { quoted: msg });
        }

        // ── RESOLVE TARGET ────────────────────────────────────────────────────
        const targetJid = resolveTargetJid(msg, args);

        if (!targetJid) {
            return reply(
                `❓ *Who should I sudo?*\n\n` +
                `*Options:*\n` +
                `• Reply to their message with *.setsudo*\n` +
                `• Tag them: *.setsudo @person*\n` +
                `• Use number: *.setsudo 2349012345678*\n` +
                `• See list: *.setsudo list*`
            );
        }

        // Don't sudo the owner themselves
        const ownerBase = phoneNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        if (targetJid === ownerBase || targetJid === normalise(ownerBase)) {
            return reply(`👑 *That is the bot owner — they already have full access.*`);
        }

        // Already sudoed?
        if (database.isSudoUser(phoneNumber, targetJid)) {
            return await sock.sendMessage(from, {
                text: `ℹ️ *@${targetJid.split('@')[0]} already has sudo access.*\n_Use .unsetsudo to remove it._`,
                mentions: [targetJid]
            }, { quoted: msg });
        }

        database.addSudoUser(phoneNumber, targetJid);

        const num = targetJid.split('@')[0];
        await sock.sendMessage(from, {
            text: `✅ *Sudo granted* — @${num} can now use bot in private mode.\n_.setsudo list · .unsetsudo @person_`,
            mentions: [targetJid]
        }, { quoted: msg });
    }
};
