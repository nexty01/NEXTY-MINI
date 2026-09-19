'use strict';
const fs = require('fs');
const path = require('path');
const IMAGE_PATH = path.resolve(__dirname, '..', '..', 'assets', 'menuimage.jpg');

module.exports = {
    name: 'resetmenuimage',
    aliases: ['clearmenuimage', 'unsetmenuimage'],
    description: 'Remove the custom menu image and revert to the menu video',
    category: 'admin',
    async execute({ reply, isOwner }) {
        if (!isOwner) return reply('🔒 *Owner only*');
        try {
            if (fs.existsSync(IMAGE_PATH)) {
                fs.unlinkSync(IMAGE_PATH);
                return reply('🗑️ Menu image removed. `.menu` will now use the menu video.');
            }
            return reply('ℹ️ No custom menu image is set.');
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};