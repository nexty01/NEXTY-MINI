/**
 * kick command — supports:
 *   .kick (reply | @mention | phone)        → kick one member
 *   .kick inactive [days]                   → kick all members inactive for N days (default 7)
 *
 * Handles both JID (@s.whatsapp.net) and LID (@lid) participant formats.
 */
const database = require('../../utils/database');

async function resolveTarget(sock, from, msg, args) {
    const ctx =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo       ||
        msg.message?.videoMessage?.contextInfo       || null;

    if (ctx?.participant) return ctx.participant;
    if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];

    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 7) {
            try {
                const meta = await sock.groupMetadata(from);
                const match = meta.participants.find(p => {
                    const pNum = p.id.split('@')[0].split(':')[0].replace(/\D/g, '');
                    return pNum === num || pNum.slice(-9) === num.slice(-9);
                });
                if (match) return match.id;
            } catch (_) {}
            return `${num}@s.whatsapp.net`;
        }
    }
    return null;
}

async function removeInBatches(sock, from, ids, batchSize = 50) {
    let removed = 0;
    const failed = [];
    for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        try {
            await sock.groupParticipantsUpdate(from, chunk, 'remove');
            removed += chunk.length;
        } catch (err) {
            failed.push({ chunk, error: err.message });
        }
    }
    return { removed, failed };
}

async function kickInactive({ sock, reply, from, sender, args, isAdmin }) {
    if (!isAdmin) return reply('🔒 Admins only.');

    const days = Math.max(1, parseInt(args[1], 10) || 7);
    const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

    try {
        const meta = await sock.groupMetadata(from);
        const botJid = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';

        const candidates = meta.participants
            .filter(p => !p.admin)
            .filter(p => p.id !== sender && p.id !== botJid);

        const inactive = candidates.filter(p => {
            const last = database.getLastSeen(from, p.id);
            return last < cutoff; // includes 0 (never seen since tracking began)
        });

        if (inactive.length === 0) {
            return reply(`✅ No members inactive for *${days}* day${days === 1 ? '' : 's'}.`);
        }

        await reply(`👻 Removing *${inactive.length}* member${inactive.length === 1 ? '' : 's'} inactive for *${days}* day${days === 1 ? '' : 's'}...`);

        const { removed, failed } = await removeInBatches(sock, from, inactive.map(p => p.id));

        let summary =
            `✅ *Inactive purge complete.*\n\n` +
            `Scanned: *${candidates.length}*\n` +
            `Threshold: *${days}* day${days === 1 ? '' : 's'}\n` +
            `Removed: *${removed}* / ${inactive.length}`;
        if (failed.length) summary += `\nFailed batches: ${failed.length}\nFirst error: ${failed[0].error}`;
        await reply(summary);
    } catch (err) {
        reply(`❌ Failed: ${err.message}`);
    }
}

module.exports = {
    name: 'kick',
    aliases: ['remove'],
    description: 'kick a group member, or .kick inactive [days] for inactive members',
    category: 'admin',

    async execute(ctx) {
        const { sock, msg, reply, args, from, sender, isGroup, isAdmin } = ctx;
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        // .kick inactive [days]
        if (args[0] && args[0].toLowerCase() === 'inactive') {
            return kickInactive({ sock, reply, from, sender, args, isAdmin });
        }

        // Single-target kick (existing behavior) — admin gate
        if (!isAdmin) return reply('🔒 Admins only.');

        const targetId = await resolveTarget(sock, from, msg, args);

        if (!targetId) {
            return reply(
                '❌ *Who do you want to kick?*\n\n' +
                '• Reply to their message + `.kick`\n' +
                '• Mention them: `.kick @user`\n' +
                '• Type number: `.kick 2348012345678`\n' +
                '• Inactive purge: `.kick inactive 7`'
            );
        }

        const displayNum = targetId.split('@')[0].split(':')[0].replace(/\D/g, '');

        try {
            await sock.groupParticipantsUpdate(from, [targetId], 'remove');
            await sock.sendMessage(from, {
                text: `🚪 @${displayNum} has been *kicked out of* the group!`,
                mentions: [targetId]
            });
        } catch (err) {
            reply(`❌ Failed to kick: ${err.message}`);
        }
    }
};
