/**
 * AutoAdd — Auto-Approve join requests (bot-wide, all groups the bot admins).
 *
 *   .autoadd                — show current status
 *   .autoadd on|off         — enable/disable the engine
 *   .autoadd delay <secs>   — how long a request sits pending before approval
 *   .autoadd cc <code|all>  — only approve requests from this country code,
 *                             or 'all' to approve any
 *
 * Owner only. Backing engine: lib/autoAddEngine.js (polls every 15s).
 */
'use strict';

const database = require('../../utils/database');

function statusBlock(s) {
    return (
        `╔══════════════════════════════╗\n` +
        `║   ✅  *AUTO APPROVE*           ║\n` +
        `╚══════════════════════════════╝\n\n` +
        `• Status       : ${s.enabled ? 'ON ✓' : 'OFF ✗'}\n` +
        `• Delay        : ${s.delaySeconds}s\n` +
        `• Country code : ${s.countryCode}\n\n` +
        `_Usage:_\n` +
        `\`.autoadd on|off\`\n` +
        `\`.autoadd delay <seconds>\`\n` +
        `\`.autoadd cc <code|all>\``
    );
}

module.exports = {
    name:        'autoadd',
    aliases:     ['autoapprove'],
    description: 'Auto-approve group join requests bot-wide',
    usage:       '.autoadd [on|off|delay <secs>|cc <code|all>]',
    category:    'owner',
    ownerOnly:   true,

    async execute({ args, reply, isOwner }) {
        if (!isOwner) return reply('🔒 *This command is for the bot owner only.*');

        const sub = (args[0] || '').toLowerCase();

        if (sub === 'on' || sub === 'off') {
            database.setAutoAdd('enabled', sub === 'on');
            return reply(statusBlock(database.getAutoAdd()));
        }

        if (sub === 'delay') {
            const secs = parseInt(args[1], 10);
            if (!Number.isFinite(secs) || secs < 0) {
                return reply('❌ Usage: *.autoadd delay <seconds>* — e.g. `.autoadd delay 60`');
            }
            database.setAutoAdd('delaySeconds', secs);
            return reply(statusBlock(database.getAutoAdd()));
        }

        if (sub === 'cc') {
            const code = (args[1] || '').trim();
            if (!code) {
                return reply('❌ Usage: *.autoadd cc <code|all>* — e.g. `.autoadd cc 234` or `.autoadd cc all`');
            }
            if (code.toLowerCase() !== 'all' && !/^\d{1,4}$/.test(code)) {
                return reply('❌ Country code must be digits only (e.g. `234`), or `all`.');
            }
            database.setAutoAdd('countryCode', code.toLowerCase() === 'all' ? 'all' : code);
            return reply(statusBlock(database.getAutoAdd()));
        }

        // no args, or unrecognized sub-command — just show status
        return reply(statusBlock(database.getAutoAdd()));
    }
};
