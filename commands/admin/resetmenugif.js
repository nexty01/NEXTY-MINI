'use strict';
const fs   = require('fs');
const path = require('path');
const GIF_PATH = path.resolve(__dirname, '..', '..', 'assets', 'menugif.mp4');

module.exports = {
    name: 'resetmenugif',
    aliases: ['clearmenugif', 'unsetmenugif'],
    description: 'Remove the custom menu GIF',
    category: 'admin',
    async execute({ reply, isOwner }) {
        if (!isOwner) return reply('🔒 *Owner only*');
        try {
            if (fs.existsSync(GIF_PATH)) {
                fs.unlinkSync(GIF_PATH);
                return reply('🗑️ Menu GIF removed. Menu will fall back to video or text.');
            }
            return reply('ℹ️ No custom menu GIF is set.');
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
