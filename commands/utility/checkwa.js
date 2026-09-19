/**
 * checkwa — Check whether a user is on WhatsApp, and whether their account
 * is a regular/personal account or a WhatsApp Business account.
 *
 * Usage:
 *   .checkwa @user        (tag a user)
 *   .checkwa              (reply to a user's message)
 *   .checkwa              (no target -> checks yourself)
 *
 * Detection is based on the target's WhatsApp Business profile (the only
 * client-type signal WhatsApp's own servers actually expose), so results
 * are Business vs Regular, not a guess at modded clients like GB WhatsApp.
 */

'use strict';

module.exports = {
    name: 'checkwa',
    aliases: ['checkwhatsapp', 'wacheck', 'checkgb'],
    description: "Check if a tagged user is on WhatsApp and whether it's a Business or regular account",
    category: 'utility',
    usage: '.checkwa @user  |  reply to a message with .checkwa',

    async execute({ sock, msg, from, sender, reply }) {
        try {
            // Resolve target: mention > reply > sender
            const ctx       = msg.message?.extendedTextMessage?.contextInfo;
            const mentioned = ctx?.mentionedJid?.[0];
            const replied   = ctx?.participant;
            const target    = mentioned || replied || sender;

            const number = target.split('@')[0].split(':')[0];

            // ── Confirm the number exists on WhatsApp ──
            let exists = true;
            let notify = '';
            try {
                const [c] = await sock.onWhatsApp(target).catch(() => []);
                if (c) {
                    exists = !!c.exists;
                    notify = c.notify || '';
                }
            } catch (_) {}

            if (!exists) {
                return reply(`🚫 *+${number}* is not registered on WhatsApp.`);
            }

            // ── Business profile check (the only client-type signal WhatsApp actually exposes) ──
            let business = null;
            try { business = await sock.getBusinessProfile(target); } catch (_) {}

            const isBusiness = !!(
                business?.description ||
                business?.email ||
                business?.website?.length ||
                business?.category
            );

            const badge = isBusiness ? '💼' : '📱';
            const type  = isBusiness ? 'WhatsApp Business' : 'WhatsApp';

            const lines = [
                `╭─❍ 𝙒𝙃𝘼𝙏𝙎𝘼𝙋𝙋 𝘾𝙃𝙀𝘾𝙆`,
                `│`,
                `│  👤  ${notify || 'Unknown'}`,
                `│  📞  +${number}`,
                `│  ${badge}  *${type}*`,
            ];

            if (isBusiness && business?.category) {
                lines.push(`│  🗂️  ${business.category}`);
            }

            lines.push(`│`, `╰────────────────────`);

            await sock.sendMessage(from, {
                text: lines.join('\n'),
                mentions: [target],
            }, { quoted: msg });
        } catch (err) {
            console.error('[checkwa]', err.message);
            reply('❌ Failed to check WhatsApp status.');
        }
    },
};
