/**
 * gcstatusdm — Post to a group's status feed FROM YOUR DM with the bot.
 *
 * - DM-only command
 * - Accepts a group invite link as the first argument (JID is resolved from it)
 * - Posts LINKS, PLAIN TEXT, images, videos, and audio (reply to media + command)
 * - Reply to an image/video/audio + .gcstatusdm <link> [caption]
 * - The invite code is never echoed back in bot replies (only masked preview shown)
 *
 * Usage (DM only):
 *   .gcstatusdm https://chat.whatsapp.com/XXXX Hello world!
 *   .gcstatusdm https://chat.whatsapp.com/XXXX https://example.com
 *   Reply to image/video/audio + .gcstatusdm https://chat.whatsapp.com/XXXX [caption]
 */

'use strict';

const gcstatus = require('./gcstatus');
const {
    downloadMedia,
    fetchLinkPreview,
    postGroupStatus,
    encodeOpus,
    getQuotedCtx,
    TEXT_BG_COLOR,
} = gcstatus;

/** Extract the invite code from a WhatsApp group link. */
function parseInviteCode(input) {
    if (!input) return null;
    const m = String(input).match(/chat\.whatsapp\.com\/(?:invite\/)?([A-Za-z0-9_-]{8,})/i);
    if (m) return m[1];
    if (/^[A-Za-z0-9_-]{8,}$/.test(input)) return input;
    return null;
}

/** Mask an invite code so it isn't spoiled in bot replies.
 *  Shows first 4 chars + "•••" e.g. "L7Er•••"
 */
function maskCode(code) {
    if (!code || code.length < 4) return '•••';
    return code.slice(0, 4) + '•••';
}

/**
 * Deeply unwrap a quoted message to find the actual media message object.
 * Handles ephemeral, viewOnce, and other wrappers.
 */
function unwrapQuoted(quotedMsg) {
    if (!quotedMsg) return null;
    if (quotedMsg.ephemeralMessage?.message)           return unwrapQuoted(quotedMsg.ephemeralMessage.message);
    if (quotedMsg.viewOnceMessage?.message)            return unwrapQuoted(quotedMsg.viewOnceMessage.message);
    if (quotedMsg.viewOnceMessageV2?.message)          return unwrapQuoted(quotedMsg.viewOnceMessageV2.message);
    if (quotedMsg.viewOnceMessageV2Extension?.message) return unwrapQuoted(quotedMsg.viewOnceMessageV2Extension.message);
    if (quotedMsg.documentWithCaptionMessage?.message) return unwrapQuoted(quotedMsg.documentWithCaptionMessage.message);
    return quotedMsg;
}

/**
 * Get the quoted message from the incoming message, trying multiple paths.
 * Baileys can surface the quoted content at different depths depending on the
 * message type (text reply, image reply, etc.).
 */
function getQuotedMessage(msg) {
    const m = msg?.message;
    if (!m) return null;

    // Standard path: text message with a quoted context
    const ctxInfo =
        m.extendedTextMessage?.contextInfo ||
        m.imageMessage?.contextInfo        ||
        m.videoMessage?.contextInfo        ||
        m.audioMessage?.contextInfo        ||
        m.stickerMessage?.contextInfo      ||
        m.documentMessage?.contextInfo     ||
        null;

    const quoted = ctxInfo?.quotedMessage;
    if (quoted) return unwrapQuoted(quoted);

    return null;
}

module.exports = {
    name:        'gcstatusdm',
    aliases:     ['gstatusdm', 'gcstatusremote'],
    description: "Post text, link, or media to a group's status feed from DM using its invite link",
    usage:       '.gcstatusdm <group-link> [text/link/caption]  OR  reply to 📷/🎥/🎵 + .gcstatusdm <group-link> [caption]',
    category:    'general',

    async execute({ sock, msg, from, sender, args, reply, isGroup, phoneNumber }) {
        if (isGroup) {
            return reply('💌 *.gcstatusdm* is DM-only. Use *.gcstatus* inside groups.');
        }

        const linkArg = args[0];
        const code    = parseInviteCode(linkArg);

        if (!code) {
            return reply(
                `📊 *GCStatus DM — Post to Group Status*\n` +
                `━━━━━━━━━━━━━━━━━━━━\n\n` +
                `*Usage:*\n` +
                `› \`.gcstatusdm <group-link> Hello world!\`\n` +
                `› \`.gcstatusdm <group-link> https://yourlink.com\`\n` +
                `› Reply to 📷 photo + \`.gcstatusdm <group-link> [caption]\`\n` +
                `› Reply to 🎥 video + \`.gcstatusdm <group-link> [caption]\`\n` +
                `› Reply to 🎵 audio + \`.gcstatusdm <group-link>\`\n\n` +
                `_Bot must already be a member of that group._`
            );
        }

        // Resolve invite → groupJid
        let groupJid;
        try {
            const info = await sock.groupGetInviteInfo(code);
            groupJid = info?.id;
            if (!groupJid) throw new Error('Could not resolve group from link');
        } catch (e) {
            return reply(`❌ _Invalid or expired group link: ${e.message}_`);
        }

        // Verify bot is a member of that group
        const normDigits = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
        let isMember = false;
        try {
            const meta = await sock.groupMetadata(groupJid);
            const botCandidates = new Set();
            if (phoneNumber)    botCandidates.add(normDigits(phoneNumber));
            if (sock.user?.id)  botCandidates.add(normDigits(sock.user.id));
            if (sock.user?.lid) botCandidates.add(normDigits(sock.user.lid));
            botCandidates.delete('');

            isMember = (meta?.participants || []).some(p => {
                const candidates = [p.id, p.jid, p.phoneNumber, p.lid]
                    .map(normDigits)
                    .filter(Boolean);
                return candidates.some(c => botCandidates.has(c));
            });
        } catch (_) {
            isMember = false;
        }

        if (!isMember) {
            return reply(
                `🚫 *Bot is not a member of that group.*\n\n` +
                `_Add the bot to the group first, then retry._`
            );
        }

        // Caption is everything after the group link arg
        const caption = args.slice(1).join(' ').trim();

        // ── Try to get quoted/replied-to media ────────────────────────────────
        const quoted = getQuotedMessage(msg);

        // ── IMAGE ─────────────────────────────────────────────────────────────
        const imgMsg = quoted?.imageMessage || quoted?.stickerMessage;
        if (imgMsg) {
            await reply('⏳ _Posting image to group status…_');
            try {
                const type = quoted.imageMessage ? 'image' : 'sticker';
                const buf  = await downloadMedia(imgMsg, type);
                await postGroupStatus(sock, groupJid, {
                    image:   buf,
                    caption: caption || '',
                });
                return reply(
                    `✅ *Posted to group status!*\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `📸 Type: *Image*\n` +
                    `🔑 Group: \`chat.whatsapp.com/${maskCode(code)}\`\n` +
                    (caption ? `💬 Caption: _${caption}_` : ``)
                );
            } catch (err) {
                return reply(`❌ _Failed to post image: ${err.message}_`);
            }
        }

        // ── VIDEO ─────────────────────────────────────────────────────────────
        if (quoted?.videoMessage) {
            await reply('⏳ _Posting video to group status…_');
            try {
                const buf = await downloadMedia(quoted.videoMessage, 'video');
                await postGroupStatus(sock, groupJid, {
                    video:   buf,
                    caption: caption || '',
                });
                return reply(
                    `✅ *Posted to group status!*\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `🎥 Type: *Video*\n` +
                    `🔑 Group: \`chat.whatsapp.com/${maskCode(code)}\`\n` +
                    (caption ? `💬 Caption: _${caption}_` : ``)
                );
            } catch (err) {
                return reply(`❌ _Failed to post video: ${err.message}_`);
            }
        }

        // ── AUDIO ─────────────────────────────────────────────────────────────
        if (quoted?.audioMessage) {
            await reply('⏳ _Posting audio to group status…_');
            try {
                const raw = await downloadMedia(quoted.audioMessage, 'audio');
                const buf = await encodeOpus(raw);
                await postGroupStatus(sock, groupJid, {
                    audio:    buf,
                    mimetype: 'audio/ogg; codecs=opus',
                    ptt:      true,
                });
                return reply(
                    `✅ *Posted to group status!*\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `🎵 Type: *Audio*\n` +
                    `🔑 Group: \`chat.whatsapp.com/${maskCode(code)}\``
                );
            } catch (err) {
                return reply(`❌ _Failed to post audio: ${err.message}_`);
            }
        }

        // ── QUOTED TEXT MESSAGE ───────────────────────────────────────────────
        const quotedText =
            quoted?.conversation ||
            quoted?.extendedTextMessage?.text ||
            '';
        if (quoted && quotedText && !caption) {
            await reply('⏳ _Posting quoted text to group status…_');
            try {
                const isUrl = /https?:\/\//i.test(quotedText);
                await postGroupStatus(sock, groupJid, {
                    text:            quotedText,
                    backgroundColor: isUrl ? undefined : TEXT_BG_COLOR,
                });
                return reply(
                    `✅ *Posted to group status!*\n` +
                    `━━━━━━━━━━━━━━━━\n` +
                    `💬 Type: *${isUrl ? 'Link' : 'Text'}*\n` +
                    `🔑 Group: \`chat.whatsapp.com/${maskCode(code)}\`\n` +
                    `📝 _"${quotedText.slice(0, 60)}${quotedText.length > 60 ? '…' : ''}"_`
                );
            } catch (err) {
                return reply(`❌ _Failed to post text: ${err.message}_`);
            }
        }

        // ── NO CONTENT PROVIDED ───────────────────────────────────────────────
        if (!caption) {
            return reply(
                `❌ *No content provided.*\n\n` +
                `Provide text or a link after the group link, or reply to a 📷/🎥/🎵.\n\n` +
                `_Example:_ \`.gcstatusdm <group-link> Hello world!\``
            );
        }

        // ── TEXT or LINK (typed after the group link) ─────────────────────────
        await reply('⏳ _Posting to group status…_');
        try {
            const isUrl = /https?:\/\//i.test(caption);

            if (isUrl) {
                // Fetch real OG metadata + full-res image for a crisp link preview
                const preview = await fetchLinkPreview(caption);
                await postGroupStatus(sock, groupJid, {
                    text:               caption,
                    richPreview:        true,
                    ...(preview.title        ? { previewTitle:       preview.title }       : {}),
                    ...(preview.description  ? { previewDescription: preview.description } : {}),
                    ...(preview.imageBuffer  ? { previewImage:       preview.imageBuffer } : {}),
                });
            } else {
                await postGroupStatus(sock, groupJid, {
                    text:            caption,
                    backgroundColor: TEXT_BG_COLOR,
                });
            }

            const safePreview = caption.slice(0, 60);
            return reply(
                `✅ *Posted to group status!*\n` +
                `━━━━━━━━━━━━━━━━\n` +
                `${isUrl ? '🔗' : '💬'} Type: *${isUrl ? 'Link' : 'Text'}*\n` +
                `🔑 Group: \`chat.whatsapp.com/${maskCode(code)}\`\n` +
                `📝 _"${safePreview}${caption.length > 60 ? '…' : ''}"_`
            );
        } catch (err) {
            return reply(`❌ _Failed to post: ${err.message}_`);
        }
    },
};
