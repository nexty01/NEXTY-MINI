/**
 * Flip Command — Flip text upside down
 * Usage: .flip <text>
 */

const flipMap = {
    'a': 'ɐ', 'b': 'q', 'c': 'ɔ', 'd': 'p', 'e': 'ǝ', 'f': 'ɟ', 'g': 'ƃ',
    'h': 'ɥ', 'i': 'ᴉ', 'j': 'ɾ', 'k': 'ʞ', 'l': 'l', 'm': 'ɯ', 'n': 'u',
    'o': 'o', 'p': 'd', 'q': 'b', 'r': 'ɹ', 's': 's', 't': 'ʇ', 'u': 'n',
    'v': 'ʌ', 'w': 'ʍ', 'x': 'x', 'y': 'ʎ', 'z': 'z',
    'A': '∀', 'B': 'q', 'C': 'Ɔ', 'D': 'p', 'E': 'Ǝ', 'F': 'Ⅎ', 'G': 'פ',
    'H': 'H', 'I': 'I', 'J': 'ſ', 'K': 'ʞ', 'L': '˥', 'M': 'W', 'N': 'N',
    'O': 'O', 'P': 'd', 'Q': 'b', 'R': 'ɹ', 'S': 'S', 'T': '┴', 'U': '∩',
    'V': 'Λ', 'W': 'M', 'X': 'X', 'Y': '⅄', 'Z': 'Z',
    '0': '0', '1': 'Ɩ', '2': 'ᄅ', '3': 'Ɛ', '4': 'h', '5': 'S', '6': '9', '7': 'L', '8': '8', '9': '6',
    '?': '¿', '!': '¡', '.': '˙', ',': "'", "'": ',', '"': ',,', '(': ')', ')': '(',
    '[': ']', ']': '[', '{': '}', '}': '{', '<': '>', '>': '<', '&': '⅋', '_': '‾'
};

module.exports = {
    name: 'flip',
    aliases: ['fliptext', 'upsidedown'],
    description: 'Flip text upside down',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply(
                `🙃 *Text Flipper*\n\n` +
                `Usage: .flip <text>\n` +
                `Example: .flip Hello World`
            );
        }

        const text = args.join(' ');
        const flipped = text.split('').map(char => flipMap[char] || char).reverse().join('');
        
        reply(`🙃 *Flipped Text*\n\n${flipped}`);
    }
};
