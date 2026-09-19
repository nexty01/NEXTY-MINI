'use strict';

const DEVICE_LABELS = {
    ios: 'iPhone (iOS)',
    android: 'Android',
    web: 'WhatsApp Web',
    desktop: 'WhatsApp Desktop',
    unknown: 'Unknown device',
};

function detectDevice(messageId) {
    // Modern WhatsApp message IDs vary in length, so prefix-based rules
    // identify the platform reliably regardless of length.
    const id = String(messageId || '').trim().toUpperCase();
    if (!id) return 'unknown';
    if (id.startsWith('3EB0')) return 'web';
    if (id.startsWith('3A')) return 'ios';
    if (id.startsWith('3F') || id.startsWith('BAE5')) return 'desktop';
    if (/^[0-9A-F]{16,40}$/.test(id)) return 'android';
    return 'unknown';
}

module.exports = {
    name: 'device',
    aliases: ['checkdevice', 'dev'],
    description: 'Detect the device a message was sent from',
    category: 'utility',
    usage: '.device (reply to a message)',

    async execute(context) {
        const { sock, msg, from, reply } = context;
        try {
            const contextInfo = msg.message?.extendedTextMessage?.contextInfo || msg.message?.contextInfo || {};
            const quotedMessage = contextInfo?.quotedMessage;
            const stanzaId = contextInfo?.stanzaId;

            if (!quotedMessage && !stanzaId) {
                return reply('Reply to a message with .device');
            }

            let quotedId = stanzaId || quotedMessage?.key?.id || quotedMessage?.id;
            if (!quotedId) {
                return reply('Cannot detect device');
            }

            const participant = contextInfo?.participant || msg.sender;
            const device = detectDevice(quotedId);
            const label = DEVICE_LABELS[device] || DEVICE_LABELS.unknown;
            const num = String(participant).split('@')[0];

            return sock.sendMessage(from, { text: `@${num}: *${label}*` }, { quoted: msg });
        } catch (err) {
            console.error('[device]', err.message);
            reply('Device check failed');
        }
    },

    detectDevice,
};
