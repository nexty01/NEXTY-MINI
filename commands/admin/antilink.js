/**
 * AntiLink Command — Ultra-robust anti-link protection with warning system
 * Usage: .antilink on/off/strict/status
 */

const database = require('../../utils/database');

module.exports = {
    name: 'antilink',
    aliases: ['nolink', 'antilinks'],
    description: 'Enable/disable robust anti-link protection in group',
    category: 'admin',
    async execute({  reply, args, from, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        // ── Admin Gate — only group admins can use this command ──
        if (!isAdmin) {
            return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
        }

        
        const action = args[0]?.toLowerCase();
        const group = database.getGroup(from);

        if (!action || !['on', 'off', 'strict', 'status', 'delete', 'kick', 'mute'].includes(action)) {
            const warnings = group.antilinkWarnings || {};
            const totalWarnings = Object.values(warnings).reduce((a, b) => a + b, 0);
            
            return reply(
                `🔗 *Anti-Link Settings*\n\n` +
                `Status: ${group.antilink ? (group.antilinkMode === 'strict' ? '🔴 STRICT' : '✅ ON') : '❌ OFF'}\n` +
                `Mode: ${group.antilinkMode || 'normal'}\n` +
                `Action: ${(group.antilinkAction || 'warn').toUpperCase()}\n` +
                `Max Warnings: ${group.antilinkMaxWarnings || 3}\n` +
                `Total Violations: ${totalWarnings}\n\n` +
                `*Usage:*\n` +
                `• .antilink on — Enable (warn + delete)\n` +
                `• .antilink off — Disable\n` +
                `• .antilink strict — Strict mode (immediate mute/kick)\n` +
                `• .antilink status — Show settings\n\n` +
                `*Warning System:*\n` +
                `• 1st violation: Warning\n` +
                `• 2nd violation: Warning\n` +
                `• 3rd violation: Mute/Kick\n\n` +
                `*Detects:*\n` +
                `✓ https/http links\n` +
                `✓ www links\n` +
                `✓ Short links (bit.ly, tinyurl, etc.)\n` +
                `✓ WhatsApp/Telegram/Discord invites\n` +
                `✓ Domains without protocol\n` +
                `✓ Obfuscated links`
            );
        }

        if (action === 'status') {
            const warnings = group.antilinkWarnings || {};
            const totalWarnings = Object.values(warnings).reduce((a, b) => a + b, 0);
            
            return reply(
                `🔗 *Anti-Link Status*\n\n` +
                `Status: ${group.antilink ? (group.antilinkMode === 'strict' ? '🔴 STRICT' : '✅ ON') : '❌ OFF'}\n` +
                `Mode: ${group.antilinkMode || 'normal'}\n` +
                `Action: ${(group.antilinkAction || 'warn').toUpperCase()}\n` +
                `Max Warnings: ${group.antilinkMaxWarnings || 3}\n` +
                `Total Violations: ${totalWarnings}\n` +
                `Warning Cooldown: ${group.antilinkCooldown || 24} hours\n\n` +
                `*Protection covers:*\n` +
                `• Standard URLs (http/https)\n` +
                `• www links\n` +
                `• Shortened URLs\n` +
                `• Invite links (WA/TG/Discord)\n` +
                `• Domain-only links\n` +
                `• Obfuscated/spaced links`
            );
        }

        if (action === 'on') {
            database.setGroup(from, 'antilink', true);
            database.setGroup(from, 'antilinkMode', 'normal');
            database.setGroup(from, 'antilinkAction', 'mute');
            database.setGroup(from, 'antilinkMaxWarnings', 3);
            database.setGroup(from, 'antilinkCooldown', 24);
            reply(
                `✅ *Anti-Link Enabled*\n\n` +
                `Mode: Normal\n` +
                `Action: Warn → Mute after 3 warnings\n` +
                `Cooldown: 24 hours\n\n` +
                `Links will be deleted and users warned.`
            );
        } else if (action === 'off') {
            database.setGroup(from, 'antilink', false);
            database.setGroup(from, 'antilinkMode', 'off');
            reply('❌ *Anti-Link Disabled*');
        } else if (action === 'strict') {
            database.setGroup(from, 'antilink', true);
            database.setGroup(from, 'antilinkMode', 'strict');
            database.setGroup(from, 'antilinkAction', 'kick');
            reply(
                `🔴 *Anti-Link Strict Mode*\n\n` +
                `⚠️ WARNING: Strict mode is active!\n\n` +
                `• Links are deleted immediately\n` +
                `• User is kicked on FIRST violation\n` +
                `• No warnings given\n\n` +
                `Use .antilink on for normal mode.`
            );
        } else if (['delete', 'kick', 'mute'].includes(action)) {
            database.setGroup(from, 'antilink', true);
            database.setGroup(from, 'antilinkAction', action);
            reply(
                `✅ *Anti-Link Action Updated*\n\n` +
                `Action: ${action.toUpperCase()}\n\n` +
                `Users will receive this punishment after max warnings.`
            );
        }
    }
};
