/**
 * promote command — supports reply, @mention, or phone number
 * Handles both JID (@s.whatsapp.net) and LID (@lid) participant formats
 */
const database = require('../../utils/database');

async function resolveTarget(sock, from, msg, args) {
    const ctx =
        msg.message?.extendedTextMessage?.contextInfo ||
        msg.message?.imageMessage?.contextInfo       ||
        msg.message?.videoMessage?.contextInfo       || null;

    // 1. Quoted reply — ctx.participant is the most direct source; keep format (JID or LID)
    if (ctx?.participant) return ctx.participant;

    // 2. @mention — also keep as-is (could be JID or LID)
    if (ctx?.mentionedJid?.length) return ctx.mentionedJid[0];

    // 3. Plain number — look it up in group metadata to get the correct JID/LID
    if (args[0]) {
        const num = args[0].replace(/[^0-9]/g, '');
        if (num.length >= 7) {
            try {
                const meta = await sock.groupMetadata(from);
                // Search by trailing digits in case of country-code differences
                const match = meta.participants.find(p => {
                    const pNum = p.id.split('@')[0].split(':')[0].replace(/\D/g, '');
                    return pNum === num || pNum.slice(-9) === num.slice(-9);
                });
                if (match) return match.id;
            } catch (_) {}
            // Fallback: construct JID manually
            return `${num}@s.whatsapp.net`;
        }
    }

    return null;
}

module.exports = {
    name: 'promote',
    aliases: ['makeadmin'],
    description: 'promote a group member (reply to message, @mention, or phone number)',
    category: 'admin',

    async execute({  sock, msg, reply, args, from, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }


        const targetId = await resolveTarget(sock, from, msg, args);

        if (!targetId) {
            return reply(
                '❌ *Who do you want to promote?*\n\n' +
                '• Reply to their message + `.promote`\n' +
                '• Mention them: `.promote @user`\n' +
                '• Type number: `.promote 2348012345678`'
            );
        }

        // Display number — strip suffix for readability
        const displayNum = targetId.split('@')[0].split(':')[0].replace(/\D/g, '');

        try {
            await sock.groupParticipantsUpdate(from, [targetId], 'promote');
            await sock.sendMessage(from, {
                text: `⭐ @${displayNum} has been *promoted to *admin* in* the group!`,
                mentions: [targetId]
            });
        } catch (err) {
            reply(`❌ Failed to promote: ${err.message}`);
        }
    }
};
