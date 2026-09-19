const database     = require('../../utils/database');
const eventManager = require('../../lib/eventManager');

module.exports = {
    name: 'welcome',
    aliases: ['welcomemsg'],
    description: 'Enable/disable/set/test welcome messages with profile pic',
    category: 'admin',
    async execute({ sock, reply, args, from, isGroup, isAdmin, isOwner, sender, phoneNumber }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isOwner && !isAdmin) {
            return reply('🔒 Only group admins (or the bot owner) can configure welcome messages.');
        }

        const action = (args[0] || '').toLowerCase();
        const group  = database.getGroup(from);

        if (!action) {
            return reply(
                `👋 *Welcome Settings*\n\n` +
                `Status: ${group.welcome ? '✅ ON' : '❌ OFF'}\n` +
                `Message: ${group.welcomeMessage || '👋 Welcome @user!'}\n\n` +
                `*Usage:*\n` +
                `• \`.welcome on\` — Enable welcome messages\n` +
                `• \`.welcome off\` — Disable welcome messages\n` +
                `• \`.welcome set <message>\` — Set custom message\n` +
                `• \`.welcome test\` — Preview the welcome banner now\n\n` +
                `_Use @user / {name} for mention, @group / {group} for group name, {count} for member count._`
            );
        }

        if (action === 'set') {
            const customMsg = args.slice(1).join(' ').trim();
            if (!customMsg) return reply('❌ Provide a message!\n\nExample: `.welcome set Hello @user, welcome to the group!`');
            database.setGroup(from, 'welcomeMessage', customMsg);
            return reply(`✅ Welcome message set to:\n_${customMsg}_\n\n_Tip: run \`.welcome test\` to preview._`);
        }

        if (action === 'test' || action === 'preview') {
            try {
                const prev = database.getGroup(from).welcome;
                if (!prev) database.setGroup(from, 'welcome', true);
                await eventManager.handleGroupParticipantsEvent(sock, phoneNumber, {
                    id: from,
                    participants: [sender],
                    action: 'add',
                    author: sender,
                });
                if (!prev) database.setGroup(from, 'welcome', false);
            } catch (e) {
                return reply(`❌ Test failed: ${e.message}`);
            }
            return;
        }

        if (!['on', 'off'].includes(action)) {
            return reply('❌ Use: `.welcome on`, `.welcome off`, `.welcome set <message>`, or `.welcome test`');
        }

        database.setGroup(from, 'welcome', action === 'on');
        reply(
            `✅ Welcome messages *${action === 'on' ? 'enabled' : 'disabled'}*!` +
            (action === 'on' ? '\n\n_Tip: run `.welcome test` to preview the banner._' : '')
        );
    }
};
