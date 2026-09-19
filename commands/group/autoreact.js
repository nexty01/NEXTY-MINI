/**
 * autoreact — toggle auto-reactions in the current group.
 * When ON, the bot reacts with a random emoji to every new message.
 * Usage: .autoreact on | off | status
 */
const database = require('../../utils/database');

module.exports = {
    name: 'autoreact',
    aliases: ['areact', 'randomreact'],
    description: 'Toggle random emoji reactions to every group message',
    category: 'group',
    async execute({ from, args, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups.');

        const action = (args[0] || 'status').toLowerCase();
        const cur = database.getGroup(from)?.autoreact === true;

        if (action === 'on' || action === 'enable') {
            database.setGroup(from, 'autoreact', true);
            return reply('✨ *Auto-react ENABLED.* The bot will react to every message with a random emoji.');
        }
        if (action === 'off' || action === 'disable') {
            database.setGroup(from, 'autoreact', false);
            return reply('🛑 *Auto-react DISABLED.*');
        }
        return reply(`📊 Auto-react is currently *${cur ? 'ON' : 'OFF'}*.\nUse *.autoreact on* or *.autoreact off*.`);
    }
};
