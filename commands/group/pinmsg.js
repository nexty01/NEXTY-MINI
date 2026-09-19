/**
 * PinMsg Command — Native WhatsApp pin via Baileys
 *
 * Usage:
 *   Reply to a message + .pin            → pin for 24h (default)
 *   Reply to a message + .pin 7d         → pin for 7 days
 *   Reply to a message + .pin 30d        → pin for 30 days
 *
 * Falls back to re-posting the quoted message if native pin is unsupported
 * by the connected Baileys version.
 */

const DURATIONS = {
    '24h': 86400,
    '7d':  7  * 86400,
    '30d': 30 * 86400,
};

module.exports = {
    name: 'pin',
    aliases: ['pinmsg', 'pinned'],
    description: 'Pin a replied message in the chat (native WhatsApp pin)',
    category: 'group',

    async execute({ sock, from, reply, msg, args, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('🛡️ Only group admins can pin messages.');

        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        const quoted = ctx?.quotedMessage;
        if (!quoted) {
            return reply('📌 Reply to a message with `.pin` to pin it.\n\nDurations: `.pin` (24h) · `.pin 7d` · `.pin 30d`');
        }

        // Build the quoted-message key
        const quotedKey = {
            remoteJid: from,
            id: ctx.stanzaId,
            fromMe: ctx.participant ? (ctx.participant === (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net') : false,
            participant: ctx.participant,
        };

        const durKey  = (args[0] || '24h').toLowerCase();
        const seconds = DURATIONS[durKey] || DURATIONS['24h'];

        // Try the native pin API first
        try {
            await sock.sendMessage(from, {
                pin: quotedKey,
                type: 1,        // 1 = pin, 2 = unpin
                time: seconds,
            });
            return reply(`📌 Message pinned for *${durKey}*.`);
        } catch (err) {
            console.error('[Pin] Native pin failed, falling back:', err?.message || err);
        }

        // Fallback: re-post the message prominently
        const text = quoted.conversation
            || quoted.extendedTextMessage?.text
            || quoted.imageMessage?.caption
            || quoted.videoMessage?.caption
            || '[non-text message]';
        return reply(
            `📌 *PINNED MESSAGE*\n` +
            `${'─'.repeat(20)}\n\n` +
            `${text}\n\n` +
            `${'─'.repeat(20)}\n` +
            `_Pinned by admin (fallback mode)_`
        );
    }
};
