const database     = require('../../utils/database');
const eventManager = require('../../lib/eventManager');

module.exports = {
    name: 'goodbye',
    aliases: ['byemsg', 'bye'],
    description: 'Enable/disable/set/test goodbye messages with profile pic',
    category: 'admin',
    async execute({ sock, reply, args, from, isGroup, isAdmin, isOwner, sender, phoneNumber }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isOwner && !isAdmin) {
            return reply('🔒 Only group admins (or the bot owner) can configure goodbye messages.');
        }

        const action = (args[0] || '').toLowerCase();
        const group  = database.getGroup(from);

        if (!action) {
            return reply(
                `👋 *Goodbye Settings*\n\n` +
                `Status: ${group.goodbye ? '✅ ON' : '❌ OFF'}\n` +
                `Message: ${group.goodbyeMessage || '👋 Goodbye @user!'}\n\n` +
                `*Usage:*\n` +
                `• \`.goodbye on\` — Enable goodbye messages\n` +
                `• \`.goodbye off\` — Disable goodbye messages\n` +
                `• \`.goodbye set Your message here\` — Set custom message\n` +
                `• \`.goodbye test\` — Preview the goodbye banner now\n\n` +
                `_Use @user to mention the leaving member_\n` +
                `_Profile picture + group name shown automatically_`
            );
        }

        if (action === 'set') {
            const customMsg = args.slice(1).join(' ').trim();
            if (!customMsg) return reply('❌ Provide a message!\n\nExample: `.goodbye set Goodbye @user, we will miss you!`');
            database.setGroup(from, 'goodbyeMessage', customMsg);
            return reply(`✅ Goodbye message set to:\n_${customMsg}_`);
        }

        if (action === 'test' || action === 'preview') {
            try {
                const prev = database.getGroup(from).goodbye;
                if (!prev) database.setGroup(from, 'goodbye', true);
                await eventManager.handleGroupParticipantsEvent(sock, phoneNumber, {
                    id: from,
                    participants: [sender],
                    action: 'remove',
                    author: sender,
                });
                if (!prev) database.setGroup(from, 'goodbye', false);
            } catch (e) {
                return reply(`❌ Test failed: ${e.message}`);
            }
            return;
        }

        if (!['on', 'off'].includes(action)) {
            return reply('❌ Use: `.goodbye on`, `.goodbye off`, `.goodbye set <message>`, or `.goodbye test`');
        }

        database.setGroup(from, 'goodbye', action === 'on');
        reply(`✅ Goodbye messages *${action === 'on' ? 'enabled' : 'disabled'}*!`);
    }
};
