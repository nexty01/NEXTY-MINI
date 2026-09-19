/**
 * AntiSpam Command — Configure anti-spam protection for the group
 * Usage:
 *   .antispam on          — enable (default: max 5 msgs per 10 seconds)
 *   .antispam off         — disable
 *   .antispam <number>    — enable with custom limit (e.g. .antispam 3)
 *   .antispam status      — show current settings
 *
 * Enforcement is handled in sessionManager.js via the spamTracker engine.
 * When a member exceeds the limit:
 *   1st offence  → warning message + message deleted
 *   2nd offence  → 2nd warning
 *   3rd offence  → kicked from group
 */

const database = require('../../utils/database');

module.exports = {
    name: 'antispam',
    aliases: ['nospam', 'spamprotect'],
    description: 'Configure anti-spam protection (enforced in real-time)',
    category: 'moderation',

    async execute({ reply, args, from, isGroup, isAdmin, isOwner }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin && !isOwner) return reply('🛡️ Only admins can configure anti-spam!');

        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'status') {
            const cfg = database.getGroup(from).antispam;
            const on  = cfg?.enabled || cfg === true;
            const lim = (typeof cfg === 'object' && cfg?.limit) ? cfg.limit : 5;
            return reply(
                '🛡️ *Anti-Spam Settings*\n\n' +
                `Status: ${on ? '✅ ON' : '❌ OFF'}\n` +
                `Limit:  ${on ? `*${lim} messages* per 10 seconds` : '—'}\n\n` +
                '*Commands:*\n' +
                '• `.antispam on`    — enable (default: 5 msgs/10s)\n' +
                '• `.antispam off`   — disable\n' +
                '• `.antispam 3`     — enable, max 3 msgs/10s\n' +
                '• `.antispam status`— show this panel\n\n' +
                '_Spammers get 2 warnings then are kicked._'
            );
        }

        if (sub === 'off') {
            database.setGroup(from, 'antispam', { enabled: false, limit: 5 });
            return reply('🛡️ *Anti-Spam DISABLED ❌*\n\nMembers can now send messages freely.');
        }

        // 'on' or a number
        const limit = sub === 'on' ? 5 : parseInt(sub);
        if (isNaN(limit) || limit < 1 || limit > 30) {
            return reply('❌ Limit must be between 1 and 30.\nExample: `.antispam 5`');
        }
        database.setGroup(from, 'antispam', { enabled: true, limit });
        reply(
            '🛡️ *Anti-Spam ENABLED ✅*\n\n' +
            `⚡ Max *${limit} messages* per 10 seconds per member.\n\n` +
            '*Punishment:*\n' +
            '• 1st offence → ⚠️ Warning + message deleted\n' +
            '• 2nd offence → ⚠️ Final warning\n' +
            '• 3rd offence → 🚫 Kicked from group\n\n' +
            '_Admins are exempt from anti-spam._'
        );
    }
};
