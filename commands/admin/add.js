module.exports = {
    name: 'add',
    aliases: ['adduser'],
    description: 'Add a user to the group',
    category: 'admin',
    async execute({ sock, reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!args[0]) return reply('❌ Usage: `.add 2348012345678`');

        const target = args[0].replace(/[^0-9]/g, '');
        if (target.length < 7) return reply('❌ Invalid phone number!');

        const targetJid = `${target}@s.whatsapp.net`;
        try {
            await sock.groupParticipantsUpdate(from, [targetJid], 'add');
            reply(`✅ *+${target}* has been added to the group!`);
        } catch (err) {
            reply(`❌ Failed to add: ${err.message}`);
        }
    }
};
