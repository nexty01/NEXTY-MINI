/**
 * SetMod — Grant a user MOD access. Mods can use the bot in private mode
 * AND are allowed to run owner-category commands (unlike sudo users).
 *
 *   .setmod              — reply to the person's message
 *   .setmod @tag         — tag them
 *   .setmod 234XXXXXXXX  — number
 *   .setmod list         — list all mods
 *
 * Only the bot owner can run this command.
 */
'use strict';

function normalise(jid) {
    if (!jid) return null;
    const base = jid.split(':')[0];
    if (base.includes('@')) return base;
    return base + '@s.whatsapp.net';
}

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

    const mentions = ctx?.mentionedJid || msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    if (mentions?.length > 0) return normalise(mentions[0]);

    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 7) return `${num}@s.whatsapp.net`;
    }
    return null;
}

module.exports = {
    name:        'setmod',
    aliases:     ['addmod', 'mod', 'modadd'],
    description: 'Grant MOD access — user can run owner commands AND normal commands',
    usage:       '.setmod (reply / @tag / number / list)',
    category:    'owner',

    async execute({ sock, msg, from, args, reply, database, phoneNumber, isOwner }) {
        if (!isOwner) return reply('🔒 *This command is for the bot owner only.*');

        const sub = (args[0] || '').toLowerCase();
        if (sub === 'list' || sub === 'ls' || sub === 'show') {
            const list = database.getModUsers(phoneNumber);
            if (!list.length) {
                return reply(`📋 *No mod users set.*\n\n_Use .setmod to add one._`);
            }
            const lines = list.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
            return await sock.sendMessage(from, {
                text:
                    `╔══════════════════════════════╗\n` +
                    `║   🛡️  *MOD USER LIST*          ║\n` +
                    `╚══════════════════════════════╝\n\n` +
                    `${lines}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `_Mods can run owner commands._\n` +
                    `_Use .unsetmod @person to revoke._`,
                mentions: list
            }, { quoted: msg });
        }

        const targetJid = resolveTargetJid(msg, args);
        if (!targetJid) {
            return reply(
                `❓ *Who should I make a mod?*\n\n` +
                `• Reply to their message with *.setmod*\n` +
                `• Tag them: *.setmod @person*\n` +
                `• Use number: *.setmod 2349012345678*\n` +
                `• See list: *.setmod list*`
            );
        }

        const ownerBase = phoneNumber.replace(/[^0-9]/g, '') + '@s.whatsapp.net';
        if (targetJid === ownerBase) {
            return reply(`👑 *That is the bot owner — they already have full access.*`);
        }

        if (database.isModUser(phoneNumber, targetJid)) {
            return await sock.sendMessage(from, {
                text: `ℹ️ *@${targetJid.split('@')[0]} is already a mod.*\n_Use .unsetmod to remove access._`,
                mentions: [targetJid]
            }, { quoted: msg });
        }

        database.addModUser(phoneNumber, targetJid);

        const num = targetJid.split('@')[0];
        await sock.sendMessage(from, {
            text:
                `╔══════════════════════════════╗\n` +
                `║   🛡️  *MOD GRANTED*            ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `👤 @${num} is now a *MOD*.\n\n` +
                `✅ Can run *owner commands*\n` +
                `✅ Can use bot in *private mode*\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `_Use .unsetmod to revoke._`,
            mentions: [targetJid]
        }, { quoted: msg });
    }
};
