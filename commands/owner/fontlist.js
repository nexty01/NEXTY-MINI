/**
 * FontList Command — Preview all 24 fonts
 * Usage: .fontlist
 */

const fontSystem = require('../../utils/fontSystem');

module.exports = {
    name: 'fontlist',
    aliases: ['fonts', 'listfonts'],
    description: 'List all 24 available fonts with previews',
    category: 'owner',

    async execute({ reply }) {
        const list = fontSystem.getFontList();

        // Split into two messages so it doesn't get too long
        const half = Math.ceil(list.length / 2);

        const buildPage = (fonts) =>
            fonts.map(f => `*${f.id}.* ${f.name}\n   ${f.sample}`).join('\n\n');

        await reply(
            `🔤 *Font List — Part 1 (1–${half})*\n\n` +
            buildPage(list.slice(0, half)) +
            `\n\n_Use .setfont <number> to apply._`
        );

        await reply(
            `🔤 *Font List — Part 2 (${half + 1}–${list.length})*\n\n` +
            buildPage(list.slice(half)) +
            `\n\n_Use .setfont 1 to reset to Normal._`
        );
    }
};
