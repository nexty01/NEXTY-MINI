/**
 * Brat Command
 * Usage: .brat <text>
 */

const axios = require('axios');

module.exports = {
    name: 'brat',
    description: 'Create a brat style sticker',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const text = args.join(' ');
        if (!text) {
            return reply('🎨 Please provide text for the brat sticker.\nExample: .brat hello');
        }

        try {
            // Using a free API that generates brat style images
            const imageUrl = `https://brat.cali.workers.dev/?q=${encodeURIComponent(text)}`;
            
            // The bot uses the 'sticker' helper if available, or we can send as image.
            // Since this is for a sticker, let's try to send it as an image that users can stickerify,
            // or use the bot's internal sticker conversion if we knew the exact helper.
            // For now, sending as image is safest.
            
            await sock.sendMessage(from, {
                image: { url: imageUrl },
                caption: `🎨 *Brat:* ${text}`
            }, { quoted: msg });
        } catch (err) {
            console.error('[brat]', err.message);
            reply('❌ Failed to generate brat image.');
        }
    }
};
