/**
 * UnsetMod — Remove a user's MOD access.
 *
 *   .unsetmod              — reply to the person's message
 *   .unsetmod @tag         — tag them
 *   .unsetmod 234XXXXXXXX  — number
 *   .unsetmod list         — list all mods
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

    const mentions = ctx?.mentionedJid || [];
    if (mentions?.length > 0) return normalise(mentions[0]);

    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 7) return `${num}@s.whatsapp.net`;
    }
    return null;
}

module.exports = {
    name:        'unsetmod',
    aliases:     ['removemod', 'delmod', 'modlist'],
    description: "Remove a user's MOD access",
    usage:       '.unsetmod (reply / @tag / number / list)',
    category:    'owner',

    async execute({ sock, msg, from, args, reply, database, phoneNumber, isOwner }) {
        if (!isOwner) return reply('🔒 *This command is for the bot owner only.*');

        const sub = (args[0] || '').toLowerCase();
        if (sub === 'list' || sub === 'ls' || sub === 'show') {
            const list = database.getModUsers(phoneNumber);
            if (!list.length) return reply(`📋 *No mod users.*\n\n_Use .setmod to add one._`);
            const lines = list.map((jid, i) => `${i + 1}. @${jid.split('@')[0]}`).join('\n');
            return await sock.sendMessage(from, {
                text:
                    `╔══════════════════════════════╗\n` +
                    `║   🛡️  *MOD USER LIST*          ║\n` +
                    `╚══════════════════════════════╝\n\n` +
                    `${lines}\n\n` +
                    `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                    `_Use .unsetmod @person to remove access._`,
                mentions: list
            }, { quoted: msg });
        }

        const targetJid = resolveTargetJid(msg, args);
        if (!targetJid) {
            return reply(
                `❓ *Who should I remove mod from?*\n\n` +
                `• Reply to their message with *.unsetmod*\n` +
                `• Tag them: *.unsetmod @person*\n` +
                `• Use number: *.unsetmod 2349012345678*\n` +
                `• See list: *.unsetmod list*`
            );
        }

        if (!database.isModUser(phoneNumber, targetJid)) {
            return await sock.sendMessage(from, {
                text: `ℹ️ *@${targetJid.split('@')[0]} is not a mod.*`,
                mentions: [targetJid]
            }, { quoted: msg });
        }

        database.removeModUser(phoneNumber, targetJid);

        const num = targetJid.split('@')[0];
        await sock.sendMessage(from, {
            text:
                `╔══════════════════════════════╗\n` +
                `║   ❌  *MOD REMOVED*            ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `👤 @${num} is no longer a *MOD*.\n\n` +
                `They can no longer run *owner commands*.\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━\n` +
                `_Use .setmod to grant it again._`,
            mentions: [targetJid]
        }, { quoted: msg });
    }
};
