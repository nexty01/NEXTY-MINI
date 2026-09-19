/**
 * OwnerBroadcast Command — Send message to all groups
 * Usage: .ownerbroadcast <message>
 */
module.exports = {
    name: 'ownerbroadcast',
    aliases: ['globalbroadcast', 'sendall'],
    description: 'Broadcast a message to all bot groups (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ sock, reply, args }) {
        if (!args.length) return reply('📡 Usage: .ownerbroadcast <message>');
        const text = args.join(' ');
        try {
            const groups = await sock.groupFetchAllParticipating();
            const groupIds = Object.keys(groups);
            if (!groupIds.length) return reply('❌ Bot is not in any groups.');
            await reply(`📡 *Broadcasting to ${groupIds.length} groups...*`);
            let sent = 0, failed = 0;
            for (const gid of groupIds) {
                try {
                    await sock.sendMessage(gid, { text: `📢 *Bot Announcement*\n\n${text}` });
                    sent++;
                    await new Promise(r => setTimeout(r, 500));
                } catch { failed++; }
            }
            reply(`✅ *Broadcast Complete!*\n\n✅ Sent: ${sent}\n❌ Failed: ${failed}\n📊 Total: ${groupIds.length}`);
        } catch (e) { reply('❌ Broadcast failed: ' + e.message); }
    }
};
