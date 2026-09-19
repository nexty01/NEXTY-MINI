/**
 * Rules Command — Set and display group rules
 * Usage: .rules | .setrules <rules>
 */
const database = require('../../utils/database');
module.exports = {
    name: 'rules',
    aliases: ['grouprules', 'setrules'],
    description: 'View or set group rules',
    category: 'admin',
    async execute({ reply, args, from, isGroup, command }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (command === 'setrules' || args[0] === 'set') {
            const rulesText = (command === 'setrules' ? args : args.slice(1)).join(' ');
            if (!rulesText) return reply('❌ Usage: .setrules <your rules here>');
            database.setGroupData(from, 'rules', rulesText);
            return reply(`📋 *Group Rules Updated!*\n\n${rulesText}`);
        }
        const saved = database.getGroupData(from, 'rules');
        if (!saved) return reply('📋 No rules set for this group.\n\nAdmins can set rules with: .setrules <rules>');
        reply(`📋 *Group Rules*\n\n${saved}`);
    }
};
