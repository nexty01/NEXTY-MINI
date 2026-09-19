/**
 * Meme Command — Get random memes
 * Usage: .meme
 */

const https = require('https');

function getMeme() {
    return new Promise((resolve, reject) => {
        https.get('https://meme-api.com/gimme', (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const meme = JSON.parse(data);
                    resolve(meme);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = {
    name: 'meme',
    aliases: ['memes', 'funnypic'],
    description: 'Get a random meme',
    category: 'fun',
    async execute({ sock, msg, from, reply }) {
        try {
            const meme = await getMeme();
            
            await sock.sendMessage(from, {
                image: { url: meme.url },
                caption: `😂 *${meme.title}*\n\n👍 ${meme.ups} upvotes\n🔗 r/${meme.subreddit}`
            }, { quoted: msg });
        } catch (err) {
            reply('❌ Failed to fetch meme. Please try again later.');
        }
    }
};
