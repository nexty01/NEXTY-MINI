/**
 * NoCall Command — Block all incoming calls and reject them instantly
 * Usage:
 *   .nocall on    — enable (all calls auto-rejected + caller notified)
 *   .nocall off   — disable
 *   .nocall status— show current state
 *
 * Enforcement: sock.ev.on('call') in sessionManager.js
 * Works for both voice and video calls, group and individual calls.
 */

const database = require('../../utils/database');

module.exports = {
    name: 'nocall',
    aliases: ['blockcall', 'callblock', 'rejectcall'],
    description: 'Block and auto-reject all incoming calls',
    category: 'moderation',

    async execute({ reply, args, from, isGroup, isAdmin, isOwner, phoneNumber }) {
        // Works in both groups and DM
        const sub     = (args[0] || '').toLowerCase();
        // Use group ID for groups, phoneNumber for DM
        const key     = isGroup ? from : phoneNumber;
        const current = database.getGroup(key)?.nocall || false;

        if (!sub || sub === 'status') {
            return reply(
                '📵 *No-Call Mode*\n\n' +
                `Status: ${current ? '✅ ON — Calls are being blocked' : '❌ OFF — Calls allowed'}\n\n` +
                '*Commands:*\n' +
                '• `.nocall on`     — block & auto-reject all calls\n' +
                '• `.nocall off`    — allow calls again\n' +
                '• `.nocall status` — show this panel\n\n' +
                '_When ON, callers receive an automatic message that calls are disabled._'
            );
        }

        if (!['on', 'off'].includes(sub)) {
            return reply('❓ Usage: `.nocall on | off | status`');
        }

        if (!isAdmin && !isOwner) return reply('🛡️ Only admins can configure call blocking!');

        const enabling = sub === 'on';
        database.setGroup(key, 'nocall', enabling);

        if (enabling) {
            reply(
                '📵 *No-Call Mode ENABLED ✅*\n\n' +
                '🚫 All incoming calls will be:\n' +
                '  • Automatically rejected instantly\n' +
                '  • Caller notified that calls are disabled\n\n' +
                '_Use `.nocall off` to allow calls again._'
            );
        } else {
            reply('✅ *No-Call Mode DISABLED*\n\nIncoming calls are now allowed again.');
        }
    }
};
