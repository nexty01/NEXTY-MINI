'use strict';

const { detectDevice } = require('./device');
const messageIndex = require('../../utils/messageIndex');

const DEVICE_LABELS = {
    ios: '📱 iPhone (iOS)',
    android: '🤖 Android',
    web: '🌐 WhatsApp Web',
    desktop: '🖥️ WhatsApp Desktop',
    unknown: '❔ Unknown',
};

function fmtDuration(seconds) {
    if (!seconds) return null;
    if (seconds < 3600) return `${Math.round(seconds / 60)} min`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)} hr`;
    return `${Math.round(seconds / 86400)} day(s)`;
}

module.exports = {
    name: 'xray',
    aliases: ['msgforensics', 'inspect'],
    description: 'Reveal the hidden metadata behind a message (forwards, device, timer, timestamp)',
    category: 'utility',
    usage: '.xray (reply to a message)',

    async execute({ sock, msg, from, phoneNumber, reply }) {
        try {
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || {};
            const quotedMessage = contextInfo?.quotedMessage;
            const stanzaId = contextInfo?.stanzaId;

            if (!quotedMessage && !stanzaId) {
                return reply('🔍 Reply to a message with *.xray* to inspect it.');
            }

            const participant = contextInfo?.participant || msg.sender || msg.key.participant || from;
            const num = String(participant).split('@')[0].split(':')[0];

            const device = detectDevice(stanzaId);
            const deviceLabel = DEVICE_LABELS[device] || DEVICE_LABELS.unknown;

            const forwardingScore = typeof contextInfo?.forwardingScore === 'number' ? contextInfo.forwardingScore : 0;
            const isForwarded = !!contextInfo?.isForwarded || forwardingScore > 0;
            let forwardLine;
            if (!isForwarded) {
                forwardLine = 'Original — never forwarded';
            } else if (forwardingScore >= 5) {
                forwardLine = `Forwarded *${forwardingScore}+* times (past WhatsApp's "frequently forwarded" threshold)`;
            } else {
                forwardLine = `Forwarded *${forwardingScore || 1}* time(s)`;
            }

            const expiration = contextInfo?.expiration || 0;
            const ephemeralLabel = expiration ? fmtDuration(expiration) : null;

            const seen = stanzaId ? messageIndex.get(phoneNumber, stanzaId) : null;
            let timestampLine;
            if (seen?.timestamp) {
                const ts = typeof seen.timestamp === 'object' ? Number(seen.timestamp.low ?? seen.timestamp) : Number(seen.timestamp);
                const date = new Date(ts * 1000);
                timestampLine = `${date.toLocaleString()} _(captured live by the bot)_`;
            } else {
                timestampLine = '_Not available — this message was sent before the bot could observe it live. WhatsApp does not include the original timestamp in reply metadata._';
            }

            const msgType = quotedMessage ? Object.keys(quotedMessage)[0]?.replace('Message', '') || 'unknown' : 'unknown';

            const lines = [
                `╭─❍ 𝙈𝙀𝙎𝙎𝘼𝙂𝙀 𝙓-𝙍𝘼𝙔`,
                `│`,
                `│  👤  Sender: @${num}`,
                `│  🧩  Type: ${msgType}`,
                `│  📡  Origin: ${deviceLabel}`,
                `│  🔁  ${forwardLine}`,
                `│  ⏱️  Vanish timer: ${ephemeralLabel ? `${ephemeralLabel} disappearing` : 'None'}`,
                `│  🕓  Sent: ${timestampLine}`,
                `│  🆔  Message ID: \`${stanzaId || 'n/a'}\``,
                `│`,
                `╰────────────────────`,
            ];

            await sock.sendMessage(from, {
                text: lines.join('\n'),
                mentions: [participant],
            }, { quoted: msg });
        } catch (err) {
            console.error('[xray]', err.message);
            reply('❌ Failed to inspect message.');
        }
    },
};
