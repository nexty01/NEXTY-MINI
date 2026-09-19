/**
 * SetGoodbyeMsg Command — Customize the goodbye message
 * Usage: .setgoodbyemsg <message>
 * Variables: {name} {group} {count} (also @user, @group)
 */
const database = require('../../utils/database');
module.exports = {
    name: 'setgoodbyemsg',
    aliases: ['customgoodbye'],
    description: 'Set a custom goodbye message for leaving members',
    category: 'admin',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args.length) return reply('📝 Usage: .setgoodbyemsg <message>\n\nVariables: {name} {group} {count} (also @user, @group)');
        const msg = args.join(' ').trim();
        // Write to the same key the participants handler reads.
        database.setGroup(from, 'goodbyeMessage', msg);
        reply(`✅ *Goodbye Message Set!*\n\nPreview:\n${msg.replace(/\{name\}/gi,'[Member]').replace(/@user/gi,'[Member]').replace(/\{group\}/gi,'[Group]').replace(/@group/gi,'[Group]').replace(/\{count\}/gi,'[N]')}\n\n_Tip: run \`.goodbye on\` to enable._`);
    }
};
