/**
 * GroupInfo (ginfo) — Rebuilt.
 *
 * Sends the group's profile picture with a full info card as the caption:
 *   - name, ID, member count, creation date, edit/message settings, description
 *   - 👑 Main Admin (Creator) — resolved from meta.owner, falling back to
 *     whichever participant holds 'superadmin' if WhatsApp doesn't expose
 *     meta.owner for older groups
 *   - ⭐ Other Admins — everyone else with admin status
 *
 * Real numbers only, never @lid: uses the same realJid() resolution
 * priority (phoneNumber > @s.whatsapp.net jid/id > raw id) already
 * established in commands/admin/listadmins.js, so creator + admin tags
 * and @mentions always resolve to the actual phone number JID.
 *
 * Usage: .ginfo  (aliases: .groupinfo, .groupdesc)
 */
'use strict';

const { getGroupPhotoBuffers } = require('../../lib/groupPhoto');

const CHANNEL_JID  = '120363426805095237@newsletter';
const CHANNEL_NAME = 'Sukuna MD Pasqua tech';

function buildChannelCtx() {
    return {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
            newsletterJid:   CHANNEL_JID,
            newsletterName:  CHANNEL_NAME,
            serverMessageId: 143,
        },
    };
}

// Resolve a participant object to its real @s.whatsapp.net JID — never @lid.
// Same priority order as listadmins.js for consistency across the bot.
function realJid(p) {
    if (!p) return null;
    if (p.phoneNumber) return p.phoneNumber.includes('@') ? p.phoneNumber : `${p.phoneNumber}@s.whatsapp.net`;
    if (p.jid && p.jid.endsWith('@s.whatsapp.net')) return p.jid;
    if (p.id && p.id.endsWith('@s.whatsapp.net')) return p.id;
    return p.id || p.lid || null; // last resort — may still be @lid if WA gave us nothing better
}

// Match a jid (from meta.owner, which may itself be @lid) back to its
// participant entry so we can pull the real phoneNumber field off it.
function findParticipant(participants, jid) {
    if (!jid) return null;
    return participants.find(p =>
        p.id === jid || p.lid === jid || p.jid === jid || p.phoneNumber === jid
    ) || null;
}

module.exports = {
    name:        'groupinfo',
    aliases:     ['ginfo', 'groupdesc'],
    description: 'Full group info card — photo, creator, real-number admin list',
    usage:       '.ginfo',
    category:    'admin',

    async execute({ sock, msg, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        try {
            const meta = await sock.groupMetadata(from);
            const participants = meta.participants || [];

            // ── Main Admin / Creator ──
            let creatorEntry = findParticipant(participants, meta.owner);
            if (!creatorEntry) {
                // Older groups often don't expose meta.owner at all — the
                // 'superadmin' flag is the reliable fallback.
                creatorEntry = participants.find(p => p.admin === 'superadmin');
            }
            const creatorJid = creatorEntry ? realJid(creatorEntry) : (meta.owner || null);

            // ── Other Admins (everyone admin, minus the creator) ──
            const otherAdminEntries = participants.filter(p =>
                (p.admin === 'admin' || p.admin === 'superadmin') && realJid(p) !== creatorJid
            );
            const adminJids = otherAdminEntries.map(realJid).filter(Boolean);

            // ── Group photo ──
            const { full } = await getGroupPhotoBuffers(sock, from).catch(() => ({ full: null }));

            // ── Caption ──
            const createdAt = meta.creation
                ? new Date(meta.creation * 1000).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
                : 'Unknown';

            const lines = [
                `╔══════════════════════════╗`,
                `║   📋 *GROUP INFO*          ║`,
                `╚══════════════════════════╝`,
                ``,
                `┌─────────────────────────`,
                `│ 🏷️  *Name:* ${meta.subject}`,
                `│ 🆔  *ID:* \`${from}\``,
                `│ 👥  *Members:* ${participants.length}`,
                `│ 📅  *Created:* ${createdAt}`,
                `│ 🔒  *Edit Info:* ${meta.restrict ? 'Admins only' : 'Everyone'}`,
                `│ 📨  *Send Messages:* ${meta.announce ? 'Admins only' : 'Everyone'}`,
                `└─────────────────────────`,
                ``,
                `📝 *Description:*`,
                meta.desc ? meta.desc.trim() : '_No description set_',
                ``,
                `👑 *Main Admin (Creator):*`,
                creatorJid ? `@${creatorJid.split('@')[0]}` : '_Not exposed by WhatsApp for this group_',
                ``,
                `⭐ *Other Admins* (${adminJids.length}):`,
                adminJids.length
                    ? adminJids.map((j, i) => `${i + 1}. @${j.split('@')[0]}`).join('\n')
                    : '_None_',
                ``,
                `> _Powered by ${CHANNEL_NAME}_`,
            ];

            const caption = lines.join('\n');
            const mentions = [creatorJid, ...adminJids].filter(Boolean);
            const contextInfo = { mentions, ...buildChannelCtx() };

            if (full) {
                await sock.sendMessage(from, {
                    image: full,
                    caption,
                    contextInfo,
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    text: `🚫 _No group photo set._\n\n` + caption,
                    contextInfo,
                }, { quoted: msg });
            }
        } catch (err) {
            console.error('[GROUPINFO]', err);
            return reply(`❌ Failed to fetch group info: ${err.message}`);
        }
    }
};
