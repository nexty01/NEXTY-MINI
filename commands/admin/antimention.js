/**
 * AntiMention Command — Configure anti-group-mention protection
 * Usage: .antimention on/off/strict/status
 */

const database = require('../../utils/database');

module.exports = {
    name: 'antimention',
    aliases: ['antitag', 'nomentions', 'antimention'],
    description: 'Configure anti-group-mention protection',
    category: 'admin',
    async execute({  reply, args, from, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }

        
        const action = args[0]?.toLowerCase();
        const group = database.getGroup(from);

        if (!action || !['on', 'off', 'strict', 'status'].includes(action)) {
            return reply(
                `🛡️ *Anti-Mention Settings*\n\n` +
                `Status: ${group.antimention ? (group.antimentionMode === 'strict' ? '🔴 STRICT' : '✅ ON') : '❌ OFF'}\n` +
                `Action: ${(group.antimentionAction || 'warn').toUpperCase()}\n` +
                `Max Mentions: ${group.antimentionMax || 5}\n\n` +
                `*Usage:*\n` +
                `• ".antimention on" — Enable (warn + delete)\n` +
                `• ".antimention off" — Disable\n` +
                `• ".antimention strict" — Enable (kick on violation)\n` +
                `• ".antimention status" — Show current settings\n\n` +
                `*Detects:*\n` +
                `• @everyone / @admins mentions\n` +
                `• Mass mentions (5+ users)\n` +
                `• Spam tagging`
            );
        }

        if (action === 'status') {
            const warnings = group.antimentionWarnings || {};
            const totalWarnings = Object.values(warnings).reduce((a, b) => a + b, 0);
            
            return reply(
                `🛡️ *Anti-Mention Status*\n\n` +
                `Status: ${group.antimention ? (group.antimentionMode === 'strict' ? '🔴 STRICT' : '✅ ON') : '❌ OFF'}\n` +
                `Mode: ${group.antimentionMode || 'normal'}\n` +
                `Action: ${(group.antimentionAction || 'warn').toUpperCase()}\n` +
                `Max Mentions: ${group.antimentionMax || 5}\n` +
                `Total Warnings: ${totalWarnings}\n\n` +
                `*Protected against:*\n` +
                `✦ @everyone / @admins\n` +
                `✦ Mass mentions (${group.antimentionMax || 5}+ users)\n` +
                `✦ Spam tagging`
            );
        }

        if (action === 'on') {
            database.setGroup(from, 'antimention', true);
            database.setGroup(from, 'antimentionMode', 'normal');
            database.setGroup(from, 'antimentionAction', 'warn');
            database.setGroup(from, 'antimentionMax', 5);
            reply(
                `✅ *Anti-Mention Enabled*\n\n` +
                `Mode: Normal\n` +
                `Action: Warn + Delete\n` +
                `Max Mentions: 5\n\n` +
                `Violators will be warned and their message deleted.`
            );
        } else if (action === 'off') {
            database.setGroup(from, 'antimention', false);
            database.setGroup(from, 'antimentionMode', 'off');
            reply('❌ *Anti-Mention Disabled*');
        } else if (action === 'strict') {
            database.setGroup(from, 'antimention', true);
            database.setGroup(from, 'antimentionMode', 'strict');
            database.setGroup(from, 'antimentionAction', 'kick');
            database.setGroup(from, 'antimentionMax', 3);
            reply(
                `🔴 *Anti-Mention Strict Mode*\n\n` +
                `Mode: STRICT\n` +
                `Action: Kick + Delete\n` +
                `Max Mentions: 3\n\n` +
                `⚠️ Violators will be KICKED from the group!`
            );
        }
    }
};
