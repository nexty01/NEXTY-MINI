/**
 * Random Profile Picture Command
 * Usage: .randompp
 * Sends 5 random profile pictures.
 */
'use strict';
const { fetchManyMedia } = require('../../lib/mediaFetch');

const ENDPOINT = 'https://prexzyapis.com/random/profilepics';
const COUNT = 5;

module.exports = {
    name: 'randompp',
    aliases: ['randomdp', 'randomprofilepic'],
    description: 'Sends 5 random profile pictures',
    category: 'fun',
    async execute({ sock, msg, from, reply }) {
        try {
            await sock.sendMessage(from, { react: { text: '⏳', key: msg.key } });

            const items = await fetchManyMedia(ENDPOINT, COUNT);
            if (!items.length) {
                await sock.sendMessage(from, { react: { text: '❌', key: msg.key } });
                return reply('❌ Could not fetch any profile pictures right now. Try again later.');
            }

            for (let i = 0; i < items.length; i++) {
                const { url, isVideo } = items[i];
                const caption = `🖼️ *Random Profile Pic* (${i + 1}/${items.length})\n\n> SUKUNA MD`;
                if (isVideo) {
                    await sock.sendMessage(from, { video: { url }, mimetype: 'video/mp4', caption }, { quoted: msg });
                } else {
                    await sock.sendMessage(from, { image: { url }, caption }, { quoted: msg });
                }
            }

            await sock.sendMessage(from, { react: { text: '✅', key: msg.key } });
        } catch (err) {
            console.error('[randompp] error:', err.message);
            try { await sock.sendMessage(from, { react: { text: '❌', key: msg.key } }); } catch {}
            reply('❌ Failed to fetch profile pictures. Try again later.');
        }
    },
};
