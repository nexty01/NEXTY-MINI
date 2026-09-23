'use strict';

module.exports = {
    name: 'deploy',
    aliases: ['pair', 'pairing', 'getpair'],
    description: 'Get the bot pairing/deployment link',
    category: 'admin',

    async execute({ sock, msg, from, reply }) {
        const PAIR_URL  = 'https://pair-site-wmte.onrender.com/';
        const PREVIEW   = `https://api.microlink.io/?url=${encodeURIComponent(PAIR_URL)}&screenshot=true&meta=false&embed=screenshot.url`;

        const card =
            `╭─❒ ◈ 𝙉𝙀𝙓𝙏𝙔 𝙈𝙄𝙉𝙄 𝗗𝗘𝗣𝗟𝗢𝗬 ❒\n` +
            `│\n` +
            `│  🚀 *Deploy Your Own Bot*\n` +
            `│\n` +
            `│  📌 *Step 1:* Open the link below\n` +
            `│  📌 *Step 2:* Enter your number\n` +
            `│  📌 *Step 3:* Scan/paste the pairing code\n` +
            `│  📌 *Step 4:* Your bot is live! 🎉\n` +
            `│\n` +
            `│  🔗 *Pairing Link:*\n` +
            `│  ${PAIR_URL}\n` +
            `│\n` +
            `│  ⚡ _Powered by 𝙉𝙀𝙓𝙏𝙔 𝙈𝙄𝙉𝙄_\n` +
            `│  📩 t.me/Pasquaking\n` +
            `╰─⛧ 𝓷𝓮𝔁𝓽𝔂 𝓿𝓮𝓻𝓲𝓯𝓲𝓮𝓭`;

        // Try to send with screenshot preview image
        try {
            await sock.sendMessage(from, {
                image: { url: PREVIEW },
                caption: card,
            }, { quoted: msg });
            return;
        } catch (_) {}

        // Fallback: text only (WhatsApp auto-generates link preview)
        await reply(card);
    },
};
