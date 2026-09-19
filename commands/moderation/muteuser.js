const database = require('../../utils/database');

const INDEFINITE = Number.MAX_SAFE_INTEGER;

function parseTime(t) {
    if (!t) return null;
    const m = t.match(/^(\d+)([smhd])$/i);
    if (!m) return null;
    const v = parseInt(m[1]);
    const u = m[2].toLowerCase();
    const x = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
    return v * x[u];
}

function formatTime(ms) {
    if (ms >= INDEFINITE) return 'until unmuted';
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

module.exports = {
    name: 'muteuser',
    aliases: ['mute', 'usermute'],
    description: 'Mute a specific user in the group (timed or indefinite)',
    category: 'moderation',

    async execute({ sock, msg, from, reply, args, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }

        try {
            const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
            const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;

            let targetUser = mentioned[0] || quotedParticipant;
            let timeArg = args[0];

            // .muteuser <number> <time>   (number-as-first-arg form)
            if (!targetUser && args.length >= 1) {
                const input = (args[0] || '').replace(/[^0-9]/g, '');
                if (input && input.length >= 6) {
                    targetUser = input + '@s.whatsapp.net';
                    timeArg = args[1]; // may be undefined → indefinite
                }
            }

            if (!targetUser) {
                return reply(
                    '🔇 *Mute User*\n\n' +
                    'Reply to a user or mention them.\n\n' +
                    '*Usage:*\n' +
                    '• .muteuser              (reply, indefinite)\n' +
                    '• .muteuser @user        (indefinite)\n' +
                    '• .muteuser 10m          (reply, timed)\n' +
                    '• .muteuser @user 1h     (timed)\n\n' +
                    '*Time:* 10s · 5m · 2h · 1d  (max 7d)\n' +
                    'Use *.unmuteuser* to lift an indefinite mute.'
                );
            }

            // No time given → indefinite mute
            let duration, expiresAt;
            if (!timeArg) {
                duration  = INDEFINITE;
                expiresAt = INDEFINITE;
            } else {
                duration = parseTime(timeArg);
                if (!duration) return reply('❌ Invalid time format! Use: 10s, 5m, 2h, or 1d  (or omit time for indefinite).');
                if (duration > 7 * 86400000) return reply('❌ Maximum timed mute is 7 days. Omit the time for an indefinite mute.');
                expiresAt = Date.now() + duration;
            }

            database.setMutedUser(from, targetUser, expiresAt);

            const num = targetUser.split('@')[0];
            const expiresLine = expiresAt >= INDEFINITE
                ? '🔓 Expires: never (until *.unmuteuser*)'
                : `🔓 Expires: ${new Date(expiresAt).toLocaleString()}`;

            reply(
                `🔇 *User Muted*\n\n` +
                `👤 User: @${num}\n` +
                `⏱️ Duration: ${formatTime(duration)}\n` +
                `${expiresLine}\n\n` +
                `Their messages will be auto-deleted until the mute is lifted.`,
                { mentions: [targetUser] }
            );
        } catch (err) {
            console.error('[MuteUser]', err);
            reply('❌ An error occurred while muting the user.');
        }
    }
};
