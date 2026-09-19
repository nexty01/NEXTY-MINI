/**
 * Hidetag Command — Tags all members silently (no visible @mentions in text)
 * Works for everyone — no admin required
 */

module.exports = {
    name: 'hidetag',
    aliases: ['htag', 'silentag', 'stag'],
    description: 'Silently tag all group members (no admin needed)',
    category: 'admin',

    async execute({ sock, msg, reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const customText = args.join(' ') || '📌';

        try {
            const metadata     = await sock.groupMetadata(from);
            const participants = metadata.participants.map(p => p.id);

            await sock.sendMessage(from, {
                text:     customText,
                mentions: participants,
            }, { quoted: msg });

        } catch (err) {
            await reply(`❌ Hidetag failed: ${err.message}`);
        }
    }
};
