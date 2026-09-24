/**
 * .setdesign <name>
 * Switches the menu design used by .menu for this bot session.
 * Designs: default (new deployments), nor, neon, classy, cyber, royal, ghost, ..., codex, dark, onyx
 */

const database = require('../../utils/database');
const { DESIGNS, isValidDesign } = require('../../utils/menuDesigns');
const { boldItalic } = require('../../utils/styleBox');

module.exports = {
    name: 'setdesign',
    aliases: ['menudesign', 'design'],
    description: 'Change the menu design style',
    category: 'admin',

    async execute({ args, reply, phoneNumber, prefix }) {
        const px = prefix || '.';
        const choice = (args[0] || '').toLowerCase().trim();
        const designOwner = String(phoneNumber || '').trim();
        const current = database.getMenuDesign(designOwner);

        if (!choice) {
            const list = DESIGNS.map(d => d === current ? `• ${d}  ⟵ active` : `• ${d}`).join('\n');
            return reply(
                `╭─❒ ◈ ${boldItalic('Menu Designs')} ❒\n` +
                `│ Current : ${current}\n` +
                `│\n${list.split('\n').map(l => '│ ' + l).join('\n')}\n` +
                `╰────────────⛧\n` +
                `\nUse: ${px}setdesign <name>\nExample: ${px}setdesign nexty`
            );
        }

        if (!isValidDesign(choice)) {
            return reply(
                `✦ Unknown design: ${choice}\nAvailable: ${DESIGNS.join(', ')}`
            );
        }

        database.setMenuDesign(designOwner, choice);
        return reply(
            `✦ ${boldItalic('Menu design updated')}\n` +
            `Now using: ${choice}\n` +
                `Run ${px}menu to see it.`
        );
    }
};
