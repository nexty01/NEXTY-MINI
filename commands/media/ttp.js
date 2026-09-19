/**
 * TTP Command — Text to picture (sticker with text)
 * Usage: .ttp <text>
 */

module.exports = {
    name: 'ttp',
    aliases: ['texttopicture', 'text2pic'],
    description: 'Create a sticker from text',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        if (!args.length) {
            return reply(
                `📝 *Text to Picture*\n\n` +
                `Usage: .ttp <text>\n` +
                `Example: .tp Hello World`
            );
        }

        const text = args.join(' ');
        
        try {
            // Use a text-to-image API
            const encodedText = encodeURIComponent(text);
            const imageUrl = `https://api.lolhuman.xyz/api/ttp?apikey=free&text=${encodedText}`;
            
            await sock.sendMessage(from, {
                sticker: { url: imageUrl }
            }, { quoted: msg });
        } catch (err) {
            reply('❌ Failed to create text sticker. Please try again.');
        }
    }
};
