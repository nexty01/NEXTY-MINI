const database = require('../../utils/database');

module.exports = {
    name: 'unban',
    aliases: ['unblockuser'],
    description: 'Unban a user',
    category: 'admin',
    async execute({ reply, args }) {
        if (!args[0]) return reply('❌ Usage: `.unban 2348012345678`');
        const target = args[0].replace(/[^0-9]/g, '');
        database.setBanned(target, false);
        reply(`✅ *+${target}* has been unbanned!`);
    }
};
