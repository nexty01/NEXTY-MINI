/** Auto-react to status.  .statusreact on|off|status  (owner only) — emojis via .statusemoji */
'use strict';
const database = require('../../utils/database');

module.exports = {
    name: 'statusreact',
    aliases: ['reactstatus', 'sreact'],
    description: 'Automatically react to every status with your custom emojis',
    usage: '.statusreact on|off|status',
    category: 'owner',
    ownerOnly: true,

    async execute({ reply, args = [], phoneNumber }) {
        const a = String(args[0] || '').toLowerCase();
        const cur = database.getStatusReact(phoneNumber);
        const emojis = database.getStatusEmojis(phoneNumber).join(' ');
        if (!a || a === 'status') {
            return reply(`💗 *STATUS REACT*: ${cur ? 'ON ✅' : 'OFF ❌'}\nEmojis: ${emojis}\n\nUse *.statusreact on|off* and *.statusemoji 🍬🎊💓* to customize.`);
        }
        if (!['on', 'off', 'enable', 'disable'].includes(a)) return reply('Use *.statusreact on* or *.statusreact off*.');
        const next = a === 'on' || a === 'enable';
        database.setStatusReact(phoneNumber, next);
        if (database.getStatusReact(phoneNumber) !== next) return reply('❌ Could not save this setting.');
        return reply(next
            ? `✅ *Status react ON*\nEmojis (one picked at random): ${emojis}\n\n_Change them with .statusemoji 🍬🎊💓💗💙_`
            : '❌ *Status react OFF*.');
    },
};
