/** Custom status reaction emojis.  .statusemoji 🍬🎊💓💗💙  |  .statusemoji reset  (owner only) */
'use strict';
const database = require('../../utils/database');

module.exports = {
    name: 'statusemoji',
    aliases: ['statusemojis', 'semoji'],
    description: 'Set the emojis used for status reactions (one is picked at random)',
    usage: '.statusemoji 🍬🎊💓💗💙',
    category: 'owner',
    ownerOnly: true,

    async execute({ reply, args = [], phoneNumber }) {
        const raw = args.join('');
        const current = database.getStatusEmojis(phoneNumber);
        if (!raw) {
            return reply(`🎭 *STATUS EMOJIS*: ${current.join(' ')}\nReact is *${database.getStatusReact(phoneNumber) ? 'ON ✅' : 'OFF ❌'}*\n\nSet: *.statusemoji 🍬🎊💓💗💙*\nReset: *.statusemoji reset*`);
        }
        if (raw.toLowerCase() === 'reset') { database.setStatusEmojis(phoneNumber, ['❤️']); return reply('🎭 Status emoji reset to ❤️'); }
        const list = database.constructor.splitEmojis ? database.constructor.splitEmojis(raw) : [];
        if (!list.length) return reply('❌ Send emojis only.\nExample: *.statusemoji 🍬🎊💓💗💙*');
        if (!database.setStatusEmojis(phoneNumber, list)) return reply('❌ Could not save the emojis.');
        const saved = database.getStatusEmojis(phoneNumber);
        return reply(`✅ *Status emojis saved:* ${saved.join(' ')}\n\nReact is *${database.getStatusReact(phoneNumber) ? 'ON' : 'OFF'}*` +
            (database.getStatusReact(phoneNumber) ? '' : ' — turn it on with *.statusreact on*'));
    },
};
