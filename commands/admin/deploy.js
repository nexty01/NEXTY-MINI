'use strict';

module.exports = {
    name: 'deploy',
    aliases: ['pair', 'pairing', 'getpair'],
    description: 'Get the bot pairing/deployment link',
    category: 'admin',

    async execute({ sock, msg, from, reply }) {
        const OFFICIAL_PROMO = '⚡ 𝗡𝗘𝗫𝗧𝗬 𝗠𝗜𝗡𝗜 👀 ⚡\n𝗢𝗳𝗳𝗶𝗰𝗶𝗮𝗹 𝗖𝗵𝗮𝗻𝗻𝗲𝗹\n𝗖𝗼𝗻𝗻𝗲𝗰𝘁 𝘆𝗼𝘂𝗿 𝗯𝗼𝘁 in seconds and unlock 𝟲𝟬𝟬+ 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀 — automation, media tools, AI, games & more, all in one bot.\n🔗 𝗖𝗼𝗻𝗻𝗲𝗰𝘁 𝗻𝗼𝘄:\nhttps://nextyxmini-production.up.railway.app/\n𝗦𝘁𝗮𝘆 𝗨𝗽𝗱𝗮𝘁𝗲𝗱 — new features, releases & maintenance alerts posted here first.\n𝗙𝗮𝘀𝘁 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 — drop your questions, we reply quick.\n👀 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗡𝗘𝗫𝗧𝗬 𝗠𝗜𝗡𝗜 👀';
        const PAIR_URL  = 'https://nextyxmini-production.up.railway.app/';
        const PREVIEW   = `https://api.microlink.io/?url=${encodeURIComponent(PAIR_URL)}&screenshot=true&meta=false&embed=screenshot.url`;

        const card =
            `╭─❒ ◈ 𝙉𝙀𝙓𝙏𝙔 𝙈𝙄𝙉𝙄 👀 𝗗𝗘𝗣𝗟𝗢𝗬 ❒\n` +
            `│\n` +
            OFFICIAL_PROMO.split('\n').map(line => `│  ${line}`).join('\n') + '\n' +
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
