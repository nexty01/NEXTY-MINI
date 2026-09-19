/**
 * EmojiMix Command — Combine two emojis
 * Usage: .emojimix <emoji1> <emoji2>
 */

module.exports = {
    name: 'emojimix',
    aliases: ['emix', 'combineemoji'],
    description: 'Combine two emojis into one sticker',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        if (args.length < 2) {
            return reply(
                `😀 *Emoji Mix*\n\n` +
                `Usage: .emojimix <emoji1> <emoji2>\n` +
                `Example: .emojimix 😂 ❤️`
            );
        }

        const emoji1 = args[0];
        const emoji2 = args[1];
        
        try {
            // Get emoji codes
            const getCode = (emoji) => {
                const code = emoji.codePointAt(0).toString(16);
                return 'u' + code;
            };
            
            const code1 = getCode(emoji1);
            const code2 = getCode(emoji2);
            
            const mixUrl = `https://www.gstatic.com/android/keyboard/emojikitchen/20201001/${code1}/${code1}_${code2}.png`;
            
            await sock.sendMessage(from, {
                image: { url: mixUrl },
                caption: `😀 *Emoji Mix*\n\n${emoji1} + ${emoji2} = Magic!`
            }, { quoted: msg });
        } catch (err) {
            reply('❌ Could not mix those emojis. Try different ones!');
        }
    }
};
