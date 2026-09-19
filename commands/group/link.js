/**
 * Link Command — Get group invite link with rich WhatsApp invite card
 * Usage: .link  (group admins only)
 *
 * Two messages are sent:
 *   1. Native groupInviteMessage card (photo + name + "Join group" button)
 *   2. Rich URL preview — uses the group photo at FULL resolution
 *
 * Sharpness fix:
 *   `groupInviteMessage.jpegThumbnail` is rendered INLINE on the recipient
 *   device. WhatsApp never re-fetches a higher-res copy. So we must embed a
 *   real, properly-sized JPEG. We use the shared `lib/groupPhoto.js` helper
 *   which downloads the HD group photo and re-encodes it through sharp to
 *   640x640 mozjpeg q90 — exactly the format clean bots ship.
 */

const { getGroupPhotoBuffers } = require('../../lib/groupPhoto');

module.exports = {
    name: 'link',
    aliases: ['grouplink', 'invitelink'],
    description: 'Get the group invite link as a rich invite card (admin only)',
    category: 'group',

    async execute({ sock, msg, from, reply, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('🛑 Only group admins can fetch the invite link.');

        try {
            const [groupMetadata, inviteCode, photos] = await Promise.all([
                sock.groupMetadata(from),
                sock.groupInviteCode(from),
                getGroupPhotoBuffers(sock, from).catch(() => ({ thumbnail: null, full: null })),
            ]);

            const groupName   = groupMetadata.subject || 'Group';
            const memberCount = groupMetadata.participants?.length || 0;
            const inviteUrl   = `https://chat.whatsapp.com/${inviteCode}`;
            const { thumbnail, full } = photos || {};

            // ── 1. Native invite card (groupInviteMessage) ───────────────────
            // Renders as the "Group chat invite" bubble with photo + Join button.
            // jpegThumbnail MUST be a small, well-formed JPEG to render sharp.
            await sock.sendMessage(from, {
                groupInviteMessage: {
                    inviteCode,
                    inviteExpiration: Math.floor(Date.now() / 1000) + 86400 * 3,
                    groupJid:  from,
                    groupName,
                    ...(thumbnail ? { jpegThumbnail: thumbnail } : {}),
                },
            }, { quoted: msg });

            // ── 2. Rich URL preview with full-res group photo ────────────────
            await sock.sendMessage(from, {
                text:               inviteUrl,
                richPreview:        true,
                previewTitle:       groupName,
                previewDescription: `${memberCount} members · Tap to join`,
                ...(full ? { previewImage: full } : {}),
                ...(thumbnail
                    ? {
                          contextInfo: {
                              externalAdReply: {
                                  title:         groupName,
                                  body:          `${memberCount} members · Tap to join`,
                                  mediaType:     1,
                                  thumbnail,
                                  sourceUrl:     inviteUrl,
                                  showAdAttribution: false,
                                  renderLargerThumbnail: true,
                              },
                          },
                      }
                    : {}),
            }, { quoted: msg });

        } catch (err) {
            console.error('[LINK CMD]', err.message);
            try {
                const inviteCode = await sock.groupInviteCode(from);
                await sock.sendMessage(from, {
                    text:        `https://chat.whatsapp.com/${inviteCode}`,
                    richPreview: true,
                }, { quoted: msg }).catch(() =>
                    reply(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${inviteCode}\n\n⚠️ Share responsibly!`)
                );
            } catch (e2) {
                reply('❌ Failed to get invite link. Make sure I am a group admin.');
            }
        }
    }
};
