/**
 * UnsetSudo Command — Remove a user's sudo access.
 *
 * Usage (any of these work):
 *   .unsetsudo             — reply to the person's message
 *   .unsetsudo @tag        — tag the person to remove
 *   .unsetsudo 2349012345678 — their phone number directly
 *   .unsetsudo list        — show all current sudo users
 *
 * Only the bot owner can run this command.
 */

'use strict';

function resolveTargetJid(msg, args) {
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

    const mentions = ctx?.mentionedJid || [];
    if (mentions?.length > 0) return normalise(mentions[0]);

    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 7) return `${num}@s.whatsapp.net`;
    }

    return null;
}

function normalise(jid) {
    if (!jid) return null;
    const base = jid.split(':')[0];
    if (base.includes('@')) return base;
    return base + '@s.whatsapp.net';
}

module.exports = {
    name:        'unsetsudo',
    aliases:     ['removesudo', 'delsudo', 'sudolist'],
    description: "Remove a user's sudo access or list all sudo users",
    usage:       '.unsetsudo (reply / @tag / number / list)',
    category:    'owner',

    async execute({ sock, msg, from, args, reply, database, phoneNumber, isOwner }) {
        if (!isOwner) {
            return reply('🔒 *This command is for the bot owner only.*');
        }

        const sub = (args[0] || '').toLowerCase();

        // ── LIST MODE ─────────────────────────────────────────────────────────
        if (sub === 'list' || sub === 'ls' || sub === 'show') {
            const list = database.getSudoUsers(phoneNumber);
            if (!list.length) {
                return reply(`📋 *No sudo users.*\n\n_Use .setsudo to add one._`);
            }
            const lines = list.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
            return await sock.sendMessage(from, {
                text:
                    `╔══════════════════════════════╗\n` +
                    `║   📋  *SUDO USER LIST*         ║\n` +
                    `╚══════════════════════════════╝\n\n` +
                    `${lines}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `_Use .unsetsudo @person to remove access_`,
                mentions: list
            }, { quoted: msg });
        }

        // ── RESOLVE TARGET ────────────────────────────────────────────────────
        const targetJid = resolveTargetJid(msg, args);

        if (!targetJid) {
            return reply(
                `❓ *Who should I remove sudo from?*\n\n` +
                `*Options:*\n` +
                `• Reply to their message with *.unsetsudo*\n` +
                `• Tag them: *.unsetsudo @person*\n` +
                `• Use number: *.unsetsudo 2349012345678*\n` +
                `• See list: *.unsetsudo list*`
            );
        }

        if (!database.isSudoUser(phoneNumber, targetJid)) {
            return await sock.sendMessage(from, {
                text: `ℹ️ *@${targetJid.split('@')[0]} does not have sudo access.*`,
                mentions: [targetJid]
            }, { quoted: msg });
        }

        database.removeSudoUser(phoneNumber, targetJid);

        const num = targetJid.split('@')[0];
        await sock.sendMessage(from, {
            text:
                `╔══════════════════════════════╗\n` +
                `║   ❌  *SUDO REMOVED*           ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `👤 @${num}'s *sudo access* has been removed.\n\n` +
                `They can no longer use bot commands in *🔒 Private mode*.\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `_Use .setsudo to grant it again_`,
            mentions: [targetJid]
        }, { quoted: msg });
    }
};
