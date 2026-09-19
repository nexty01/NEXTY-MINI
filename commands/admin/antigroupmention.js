/**
 * AntiGroupMention Command — Protect group from @everyone/@group mentions
 * Usage: .antigroupmention on/off/set/get/status
 */

const database = require('../../utils/database');

module.exports = {
    name: 'antigroupmention',
    aliases: ['agm', 'notagall', 'antigmention'],
    description: 'Protect group from unauthorized @everyone / group-wide mentions',
    category: 'admin',
    async execute({ sock, reply, args, from, isGroup, isAdmin, isBotAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');


        const action = args[0]?.toLowerCase();
        const group = database.getGroup(from);
        const isEnabled = group.antigroupmention || false;
        const currentAction = group.antigroupmentionAction || 'delete';
        const violations = group.antigroupmentionViolations || 0;

        // ── No args or invalid — show full dashboard ──
        if (!action || !['on', 'off', 'set', 'get', 'status', 'reset'].includes(action)) {
            const statusIcon = isEnabled ? '🟢' : '🔴';
            const statusText = isEnabled ? 'ACTIVE' : 'INACTIVE';
            const actionIcon = currentAction === 'kick' ? '👢' : '🗑️';

            return reply(
                `╔══════════════════════════╗\n` +
                `║  🛡️ *ANTI-GROUP MENTION*  ║\n` +
                `╚══════════════════════════╝\n\n` +
                `┌─────────────────────────┐\n` +
                `│ ${statusIcon} Status:  *${statusText}*\n` +
                `│ ${actionIcon} Action:  *${currentAction.toUpperCase()}*\n` +
                `│ 📊 Violations: *${violations}*\n` +
                `└─────────────────────────┘\n\n` +
                `🔧 *COMMANDS*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `▸ .agm on — Enable protection\n` +
                `▸ .agm off — Disable protection\n` +
                `▸ .agm set delete — Delete message\n` +
                `▸ .agm set kick — Kick the sender\n` +
                `▸ .agm status — View current config\n` +
                `▸ .agm reset — Reset violation count\n\n` +
                `🔍 *WHAT IT DETECTS*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `✓ @everyone mentions\n` +
                `✓ @group mentions\n` +
                `✓ Mass member tagging\n` +
                `✓ Hidden mention exploits\n\n` +
                `_Admins are exempt from this filter._`
            );
        }

        // ── ON ──
        if (action === 'on') {
            if (isEnabled) {
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  ⚠️ *ALREADY ENABLED*     ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `Antigroupmention is already active!\n` +
                    `Current action: *${currentAction.toUpperCase()}*\n\n` +
                    `Use .agm set <delete|kick> to change action.`
                );
            }
            database.setGroup(from, 'antigroupmention', true);
            database.setGroup(from, 'antigroupmentionAction', 'delete');
            database.setGroup(from, 'antigroupmentionViolations', 0);
            return reply(
                `╔══════════════════════════╗\n` +
                `║  ✅ *PROTECTION ENABLED*  ║\n` +
                `╚══════════════════════════╝\n\n` +
                `🛡️ Antigroupmention is now *ACTIVE*\n\n` +
                `┌─────────────────────────┐\n` +
                `│ 🟢 Status:  *ON*\n` +
                `│ 🗑️ Action:  *DELETE*\n` +
                `│ 👑 Admins:  *Exempt*\n` +
                `└─────────────────────────┘\n\n` +
                `Non-admin group mentions will be\n` +
                `automatically deleted.\n\n` +
                `_Use .agm set kick for stricter action._`
            );
        }

        // ── OFF ──
        if (action === 'off') {
            database.setGroup(from, 'antigroupmention', false);
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🔴 *PROTECTION DISABLED* ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Antigroupmention has been turned *OFF*.\n` +
                `Members can now use group mentions freely.\n\n` +
                `_Use .agm on to re-enable._`
            );
        }

        // ── SET ──
        if (action === 'set') {
            const setAction = args[1]?.toLowerCase();
            if (!setAction || !['delete', 'kick'].includes(setAction)) {
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  ⚙️ *SET ACTION*          ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `Choose a punishment action:\n\n` +
                    `┌─────────────────────────┐\n` +
                    `│ 🗑️ .agm set delete\n` +
                    `│    → Deletes the message\n` +
                    `│\n` +
                    `│ 👢 .agm set kick\n` +
                    `│    → Kicks the sender\n` +
                    `└─────────────────────────┘`
                );
            }

            database.setGroup(from, 'antigroupmentionAction', setAction);
            database.setGroup(from, 'antigroupmention', true);

            const icon = setAction === 'kick' ? '👢' : '🗑️';
            const desc = setAction === 'kick'
                ? 'Violators will be *kicked* immediately!'
                : 'Offending messages will be *deleted*.';

            return reply(
                `╔══════════════════════════╗\n` +
                `║  ✅ *ACTION UPDATED*      ║\n` +
                `╚══════════════════════════╝\n\n` +
                `${icon} Action set to: *${setAction.toUpperCase()}*\n\n` +
                `${desc}\n\n` +
                `_Protection auto-enabled._`
            );
        }

        // ── GET / STATUS ──
        if (action === 'get' || action === 'status') {
            const statusIcon = isEnabled ? '🟢' : '🔴';
            const statusText = isEnabled ? 'ACTIVE' : 'INACTIVE';
            const actionIcon = currentAction === 'kick' ? '👢' : '🗑️';
            const bar = isEnabled ? '▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓' : '░░░░░░░░░░░░░░░░░░░░';

            return reply(
                `╔══════════════════════════╗\n` +
                `║  📊 *AGM DASHBOARD*      ║\n` +
                `╚══════════════════════════╝\n\n` +
                `┌─────────────────────────┐\n` +
                `│ ${statusIcon} Status:     *${statusText}*\n` +
                `│ ${actionIcon} Action:     *${currentAction.toUpperCase()}*\n` +
                `│ 📈 Violations: *${violations}*\n` +
                `│ 👑 Exempted:   *Admins*\n` +
                `└─────────────────────────┘\n\n` +
                `Protection: [${bar}]\n\n` +
                `_Last updated: ${new Date().toLocaleString()}_`
            );
        }

        // ── RESET ──
        if (action === 'reset') {
            database.setGroup(from, 'antigroupmentionViolations', 0);
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🔄 *VIOLATIONS RESET*   ║\n` +
                `╚══════════════════════════╝\n\n` +
                `📊 Violation counter has been reset to *0*.\n\n` +
                `_All members start fresh._`
            );
        }
    }
};
