'use strict';

module.exports = {
    name: 'getgpp',
    aliases: ['grouppic', 'gpp', 'grouppp'],
    description: 'Get the group profile picture',
    category: 'admin',

    async execute({ sock, msg, from, reply, isGroup }) {
        if (!isGroup) return reply('❌ This command is for groups only.');

        try {
            const ppUrl = await sock.profilePictureUrl(from, 'image');
            await sock.sendMessage(from, {
                image: { url: ppUrl },
                caption:
                    `╭─❒ ◈ 𝙉𝙀𝙓𝙏𝙔 𝙈𝙄𝙉𝙄 ❒\n` +
                    `│ 🖼️ *Group Profile Picture*\n` +
                    `╰─⛧ 𝓷𝓮𝔁𝓽𝔂 𝓿𝓮𝓻𝓲𝓯𝓲𝓮𝓭`,
            }, { quoted: msg });
        } catch (_) {
            reply('❌ This group has no profile picture set.');
        }
    },
};
