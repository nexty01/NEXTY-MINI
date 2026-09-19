/**
 * Tagall Command — Tags every member in the group with a beautiful, classy message
 */

const config = require('../../config');

module.exports = {
    name: 'tagall',
    aliases: ['mentionall', 'everyone'],
    description: 'Tag all members in the group',
    category: 'admin',

    async execute({ sock, msg, reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const customText = args.join(' ') || '📢 Attention required!';

        try {
            const metadata     = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const groupName    = metadata.subject || 'Group';
            const total        = participants.length;

            const divider = '▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰▰';

            let message =
`${divider}
╔╦══〔 👹 *${config.botName}* 👹 〕══╦╗

  📣  *${customText}*

${divider}

🔔 *${groupName}* — All ${total} members are being summoned:

`;

            participants.forEach((p, i) => {
                const num = p.split('@')[0];
                message += `  〄 @${num}\n`;
            });

            message +=
`
${divider}
┊ 👑 *Powered by ${config.botName} v${config.version || '2.0'}*
╚══════════════════════════════╝`;

            await sock.sendMessage(from, {
                text:     message,
                mentions: participants,
            }, { quoted: msg });

        } catch (err) {
            await reply(
`╔══════════════════════════════╗
║   ❌  *TAGALL FAILED*          ║
╚══════════════════════════════╝

_Reason: ${err.message}_`
            );
        }
    }
};
