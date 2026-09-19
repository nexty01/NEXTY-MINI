/**
 * AntiGroupStatus Command — Block/delete group status posts made by members
 * Usage: .antigroupstatus on/off/kick/status
 *
 *   • .antigroupstatus on    — delete any group status posted by non-admins
 *   • .antigroupstatus kick  — delete + kick the violator immediately
 *   • .antigroupstatus off   — disable
 *   • .antigroupstatus status — show current setting
 *
 * Enforcement is done in sessionManager.js (see the hook below).
 * NOTE: No isAdmin gate here — the bot's own admin status in the group
 * is NOT checked. Only the SENDER (the person running the command) must
 * be a group admin.
 */

const database = require('../../utils/database');

module.exports = {
    name: 'antigroupstatus',
    aliases: ['nogcstatus', 'blockgcstatus', 'antigcstatus'],
    description: 'Prevent non-admin members from posting to group status feed',
    category: 'admin',

    async execute({ reply, args, from, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');

        const action = args[0]?.toLowerCase();
        const group  = database.getGroup(from);

        // ── Status display (no arg or "status") ──────────────────────────────
        if (!action || action === 'status') {
            const mode = group.antigroupstatus;
            return reply(
                `📊 *Anti-Group-Status Settings*\n\n` +
                `Status : ${mode === 'kick' ? '🔴 ON (KICK)' : mode === 'on' ? '✅ ON (DELETE)' : '❌ OFF'}\n` +
                `Action : ${mode === 'kick' ? 'DELETE + KICK' : mode === 'on' ? 'DELETE only' : 'None'}\n\n` +
                `*Usage:*\n` +
                `• \`.antigroupstatus on\`   — delete group-status posts by members\n` +
                `• \`.antigroupstatus kick\`  — delete + kick the poster\n` +
                `• \`.antigroupstatus off\`   — disable\n` +
                `• \`.antigroupstatus status\` — show this panel\n\n` +
                `_Admins are always exempt from this rule._`
            );
        }

        if (action === 'on') {
            database.setGroup(from, 'antigroupstatus', 'on');
            return reply(
                `✅ *Anti-Group-Status Enabled*\n\n` +
                `• Non-admin group-status posts will be *deleted automatically*\n` +
                `• Admins are exempt\n\n` +
                `Use \`.antigroupstatus kick\` to also kick violators.`
            );
        }

        if (action === 'kick') {
            database.setGroup(from, 'antigroupstatus', 'kick');
            return reply(
                `🔴 *Anti-Group-Status — Kick Mode*\n\n` +
                `• Non-admin group-status posts are *deleted immediately*\n` +
                `• The poster is *kicked* from the group\n` +
                `• Admins are exempt\n\n` +
                `Use \`.antigroupstatus on\` for delete-only mode.`
            );
        }

        if (action === 'off') {
            database.setGroup(from, 'antigroupstatus', false);
            return reply('❌ *Anti-Group-Status Disabled*\n\nMembers can now post to group status freely.');
        }

        return reply(
            `❓ Unknown option *"${action}"*\n\n` +
            `Valid options: \`on\` · \`kick\` · \`off\` · \`status\``
        );
    }
};
