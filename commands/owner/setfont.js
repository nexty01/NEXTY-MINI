/**
 * SetFont Command — Change the bot's response font (1–24)
 * Usage: .setfont <number>
 */

const database   = require('../../utils/database');
const fontSystem = require('../../utils/fontSystem');

module.exports = {
    name: 'setfont',
    aliases: ['changefont', 'font'],
    description: 'Set the bot font style (1–24)',
    category: 'owner',

    async execute({ reply, args, phoneNumber, isOwner }) {
        if (!isOwner) return reply('🔒 This command is reserved for the bot owner only.');

        if (!args.length) {
            return reply(
                `🔤 *Set Font*\n\n` +
                `Usage: *.setfont <number>*\n` +
                `Range: 1 – ${fontSystem.maxFont}\n\n` +
                `Use *.fontlist* to preview all fonts.\n\n` +
                `_Example:_ .setfont 6`
            );
        }

        const fontNumber = parseInt(args[0]);

        if (isNaN(fontNumber) || !fontSystem.isValidFont(fontNumber)) {
            return reply(`❌ Invalid font number. Choose between 1 and ${fontSystem.maxFont}.\nUse *.fontlist* to see all options.`);
        }

        database.setFont(phoneNumber, fontNumber);

        const fontName   = fontSystem.getFontName(fontNumber);
        const preview    = fontSystem.convert(`Font ${fontNumber} — ${fontName}`, fontNumber);

        // reply itself will NOW be rendered in the new font
        reply(
            `✅ *Font changed to #${fontNumber} — ${fontName}*\n\n` +
            `Preview: ${preview}\n\n` +
            `_Every bot response will now use this style._\n` +
            `Use *.setfont 1* to reset to Normal.`
        );
    }
};
