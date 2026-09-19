'use strict';

const fontmakerLib = require('../../utils/fontmakerLib');

module.exports = {
    name: 'fontmaker',
    aliases: ['font', 'fonts', 'textfont'],
    description: 'Convert text to different font styles',
    category: 'utility',
    usage: '.fontmaker <number> <text>',

    execute: async (context) => {
        try {
            const { args, reply } = context;

            if (args.length < 2) {
                const list = fontmakerLib.listAllFonts().join('\n');
                return reply(`Fonts:\n${list}\n\n.fontmaker <number> <text>`);
            }

            const fontNumber = parseInt(args[0]);
            const text = args.slice(1).join(' ');

            if (isNaN(fontNumber)) {
                return reply('Number required');
            }

            if (!fontmakerLib.isValidFont(fontNumber)) {
                return reply(`Font 1-${fontmakerLib.getMaxFont()}`);
            }

            if (!text?.trim()) {
                return reply('Provide text');
            }

            const result = fontmakerLib.convert(text, fontNumber);
            return reply(result, { raw: true });
        } catch (err) {
            console.error('[fontmaker]', err.message);
            return context.reply('Error');
        }
    }
};
