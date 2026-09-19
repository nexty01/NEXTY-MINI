module.exports = {
    name: 'broadcast',
    aliases: ['bc'],
    description: 'Broadcast a message to all group members',
    category: 'admin',
    async execute({ sock, reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const text = args.join(' ');
        if (!text) return reply('❌ Usage: `.broadcast Your message here`');

        try {
            const metadata = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);
            const msg = `📢 *BROADCAST*\n\n${text}`;
            await sock.sendMessage(from, { text: msg, mentions: participants });
            reply(`✅ Broadcast sent to ${participants.length} members!`);
        } catch (err) {
            reply(`❌ Failed: ${err.message}`);
        }
    }
};
