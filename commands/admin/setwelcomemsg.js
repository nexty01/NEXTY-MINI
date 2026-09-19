/**
 * SetWelcomeMsg Command — Customize the welcome message
 * Usage: .setwelcomemsg <message>
 * Variables: {name} {group} {count} (also @user, @group)
 */
const database = require('../../utils/database');
module.exports = {
    name: 'setwelcomemsg',
    aliases: ['customwelcome'],
    description: 'Set a custom welcome message for new members',
    category: 'admin',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args.length) return reply(
            '📝 *Set Welcome Message*\n\nUsage: .setwelcomemsg <message>\n\nVariables:\n{name} or @user = New member\n{group} or @group = Group name\n{count} = Member count\n\nExample:\n.setwelcomemsg Welcome {name} to {group}! You are member #{count}!'
        );
        const msg = args.join(' ').trim();
        // Write to the same key the participants handler reads.
        database.setGroup(from, 'welcomeMessage', msg);
        reply(`✅ *Welcome Message Set!*\n\nPreview:\n${msg.replace(/\{name\}/gi,'[Member]').replace(/@user/gi,'[Member]').replace(/\{group\}/gi,'[Group]').replace(/@group/gi,'[Group]').replace(/\{count\}/gi,'[N]')}\n\n_Tip: run \`.welcome on\` to enable._`);
    }
};
