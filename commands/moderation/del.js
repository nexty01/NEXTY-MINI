/**
 * .del / .delete — delete a message for everyone, by replying to it.
 *
 * Usage: reply to a message + `.del` (or `.delete`)
 *
 *   • Reply to the BOT's own message (any chat) → always deletable.
 *   • Reply to someone ELSE's message in a GROUP → admin only.
 *   • Reply to someone ELSE's message in a private 1:1 → refused
 *     (WhatsApp doesn't allow it).
 */

const sessionManager = require('../../lib/sessionManager');

function digits(s) {
    return String(s || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

module.exports = {
    name: 'del',
    aliases: ['delete'],
    description: "Delete a replied-to message — your own anywhere, or anyone's in a group if you're an admin",
    category: 'moderation',
    usage: '.del (reply to a message)',

    async execute({ sock, msg, from, isGroup, isAdmin, reply }) {
        try {
            const ctxInfo =
                msg.message?.extendedTextMessage?.contextInfo ||
                msg.message?.imageMessage?.contextInfo ||
                msg.message?.videoMessage?.contextInfo ||
                msg.message?.documentMessage?.contextInfo ||
                msg.message?.audioMessage?.contextInfo ||
                msg.message?.stickerMessage?.contextInfo ||
                null;

            const quotedId = ctxInfo?.stanzaId;
            if (!quotedId) {
                return reply(
                    '❌ *Reply to a message* with `.del` (or `.delete`) to delete it.\n\n' +
                    "• Reply to the bot's own message → always deletable.\n" +
                    "• Reply to someone else's message in a group → only works if you're a group admin."
                );
            }

            const cached = sessionManager.getCachedMessage(from, quotedId);

            // Bot identity in every form WhatsApp may have stamped on the
            // original message: pn (phone) JID, lid JID, and raw digits.
            const botPnJid  = sock.user?.id ? `${sock.user.id.split(':')[0]}@s.whatsapp.net` : null;
            const botLidJid = sock.user?.lid || null;
            const botNum    = digits(sock.user?.id);

            // Figure out who sent the quoted message.
            let quotedFromMe = false;
            let quotedParticipant = ctxInfo.participant || null;

            if (cached?.key) {
                quotedFromMe = !!cached.key.fromMe;
                quotedParticipant = cached.key.participant || quotedParticipant;
            } else if (isGroup) {
                const qNum = digits(quotedParticipant);
                quotedFromMe = !!qNum && qNum === botNum;
            } else {
                // DM, uncached — quoted is "ours" iff the other side of
                // the chat isn't us. The chat JID `from` in a DM is the
                // other person, so a quoted message in a DM is ours when
                // contextInfo.participant is absent / equals us.
                const qNum = digits(quotedParticipant);
                quotedFromMe = !qNum || qNum === botNum;
            }

            if (!isGroup && !quotedFromMe) {
                return reply(
                    "❌ I can only delete *my own* messages in a private chat — " +
                    "WhatsApp doesn't allow deleting someone else's DM message for everyone."
                );
            }

            if (isGroup && !quotedFromMe && !isAdmin) {
                return reply("🔒 Admins only — you need to be a group admin to delete someone else's message.");
            }

            // ── Build the delete key ─────────────────────────────────────
            // Prefer the cached key verbatim — that's the exact key WA
            // gave us when the message arrived, including the right
            // participant format (pn vs lid). Falls back to a constructed
            // key when the message isn't in cache.
            let deleteKey;
            if (cached?.key) {
                deleteKey = {
                    remoteJid: cached.key.remoteJid || from,
                    fromMe:    !!cached.key.fromMe,
                    id:        cached.key.id || quotedId,
                };
                if (cached.key.participant) deleteKey.participant = cached.key.participant;
            } else {
                deleteKey = { remoteJid: from, fromMe: quotedFromMe, id: quotedId };
                if (isGroup) {
                    deleteKey.participant = quotedFromMe
                        ? (botLidJid || botPnJid)
                        : quotedParticipant;
                }
            }

            // Try once; if WhatsApp rejects (often because participant is
            // in the wrong format — pn vs lid), retry with the alternate
            // bot JID form for own messages.
            try {
                await sock.sendMessage(from, { delete: deleteKey });
            } catch (e1) {
                if (isGroup && deleteKey.fromMe) {
                    const alt = deleteKey.participant === botLidJid ? botPnJid : botLidJid;
                    if (alt && alt !== deleteKey.participant) {
                        await sock.sendMessage(from, { delete: { ...deleteKey, participant: alt } });
                    } else {
                        throw e1;
                    }
                } else {
                    throw e1;
                }
            }

            await sock.sendMessage(from, { react: { text: '🗑️', key: msg.key } }).catch(() => {});
        } catch (err) {
            console.error('[del]', err);
            reply(`❌ Failed to delete: ${err.message || 'unknown error'}`);
        }
    },
};
