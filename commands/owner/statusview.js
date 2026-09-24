/** Auto-view status.  .statusview on|off|status  (owner only) */
'use strict';
const database = require('../../utils/database');

module.exports = {
    name: 'statusview',
    aliases: ['viewstatus', 'sview'],
    description: 'Automatically view every status',
    usage: '.statusview on|off|status',
    category: 'owner',
    ownerOnly: true,

    async execute({ reply, args = [], phoneNumber }) {
        const a = String(args[0] || '').toLowerCase();
        const cur = database.getAutoViewStatus(phoneNumber);
        if (!a || a === 'status') {
            return reply(`👁️ *STATUS VIEW*: ${cur ? 'ON ✅' : 'OFF ❌'}\n\nUse *.statusview on* / *.statusview off*`);
        }
        if (!['on', 'off', 'enable', 'disable'].includes(a)) return reply('Use *.statusview on* or *.statusview off*.');
        const next = a === 'on' || a === 'enable';
        database.setAutoViewStatus(phoneNumber, next);
        if (database.getAutoViewStatus(phoneNumber) !== next) return reply('❌ Could not save this setting.');
        return reply(next ? '✅ *Status view ON* — every new status is marked as viewed.' : '❌ *Status view OFF*.');
    },
};
