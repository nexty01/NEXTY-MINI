/**
 * pp — fetch a user's profile picture.
 * Usage:
 *   .pp                 -> your own pp
 *   .pp @user           -> mentioned user's pp
 *   reply with .pp      -> replied user's pp
 */
module.exports = {
    name: 'pp',
    aliases: ['profilepic', 'getpp'],
    description: 'Fetch a user\'s profile picture',
    category: 'utility',
    async execute({ sock, msg, from, sender, reply }) {
        try {
            // Resolve target JID: mention > reply > sender
            const ctx = msg.message?.extendedTextMessage?.contextInfo;
            const mentioned = ctx?.mentionedJid?.[0];
            const replied   = ctx?.participant;
            const target    = mentioned || replied || sender;

            let url = null;
            try { url = await sock.profilePictureUrl(target, 'image'); } catch (_) {}

            if (!url) {
                return reply(`🚫 No profile picture available for @${target.split('@')[0].split(':')[0]}.`);
            }

            await sock.sendMessage(from, {
                image: { url },
                caption: `📸 Profile picture of @${target.split('@')[0].split(':')[0]}`,
                mentions: [target],
            }, { quoted: msg });
        } catch (e) {
            console.error('[pp]', e.message);
            reply('❌ Failed to fetch profile picture.');
        }
    }
};
