/**
 * .channel — share the official NEXTY MINI WhatsApp channel
 *
 * Sends a stylised text reply with a tappable "View Channel" pill
 * (forwardedNewsletterMessageInfo) so users can join in one tap.
 */

const config = require('../../config');

const CHANNEL_JID  = '120363424109748354@newsletter';
const CHANNEL_NAME = 'NEXTY MINI';
const CHANNEL_URL  = 'https://whatsapp.com/channel/0029VbCJho147XeEEuR1LA3s';

module.exports = {
    name: 'channel',
    aliases: ['newsletter'],
    description: 'Share the official NEXTY MINI channel',
    category: 'general',

    async execute({ sock, msg, from, reply }) {
        const url = config.owner?.channel || CHANNEL_URL;
        const text =
`╭━━━〔 ⛧ *𝙉𝙀𝙓𝙏𝙔 𝙈𝙄𝙉𝙄 𝘾𝙃𝘼𝙉𝙉𝙀𝙇* ⛧ 〕━━━╮
┃ ✦ *Name* : ${CHANNEL_NAME}
┃ ✦ *Vibe* : Updates · Drops · Tips
┃ ✦ *Host* : NEXTY MINI
┃
┃ 🔗 *Tap to join:*
┃    ${url}
┃
┃ ⤷ _Or tap the pill above to follow._
╰━━━━━━━━━━━━━━━━━━━━━━━━━╯
       ⛧  𝙋𝙤𝙬𝙚𝙧𝙚𝙙 𝙗𝙮 𝙉𝙀𝙓𝙏𝙔 𝙈𝙄𝙉𝙄  ⛧`;

        try {
            await sock.sendMessage(from, {
                text,
                contextInfo: {
                    isForwarded: true,
                    forwardingScore: 999,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid:   CHANNEL_JID,
                        newsletterName:  CHANNEL_NAME,
                        serverMessageId: 143,
                    },
                    externalAdReply: {
                        title:        CHANNEL_NAME,
                        body:         'Tap to join the official channel',
                        mediaType:    1,
                        sourceUrl:    url,
                        thumbnailUrl: 'https://i.imgur.com/0nF1lKx.png',
                        renderLargerThumbnail: false,
                        showAdAttribution: false,
                    },
                },
            }, { quoted: msg });
        } catch (_) {
            await reply(text);
        }
    }
};
