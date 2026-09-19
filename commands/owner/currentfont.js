/**
 * CurrentFont Command — Show current font
 * Usage: .currentfont
 */

const database = require('../../utils/database');
const fontSystem = require('../../utils/fontSystem');

module.exports = {
    name: 'currentfont',
    aliases: ['myfont', 'showfont'],
    description: 'Show the current font setting',
    category: 'owner',
    async execute({ reply, phoneNumber }) {
        const currentFont = database.getFont(phoneNumber);
        const fontName = fontSystem.getFontName(currentFont);
        const sampleText = fontSystem.convert('SUKUNA MD BOT', currentFont);
        
        reply(
            `📝 *Current Font*\n\n` +
            `Font Number: ${currentFont}\n` +
            `Font Name: ${fontName}\n\n` +
            `Preview:\n${sampleText}\n\n` +
            `Use .setfont <number> to change.`
        );
    }
};
