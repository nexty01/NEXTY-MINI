/**
 * Antisticker — Auto-deletes EVERY sticker sent in the group when enabled.
 *
 * Different from .mutesticker (which blocks a specific sticker hash).
 * Toggle: .antisticker
 * Admin only.
 */
'use strict';

const database = require('../../utils/database');

module.exports = {
    name: 'antisticker',
    aliases: ['nosticker', 'stickerblock'],
    description: 'Auto-delete all stickers in the group when enabled',
    category: 'moderation',
    usage: '.antisticker',

    async execute({ from, isGroup, isAdmin, isOwner, reply }) {
        if (!isGroup)             return reply('👥 This command can only be used in groups!');
        if (!isAdmin && !isOwner) return reply('🛡️ *Admin Only!* You must be a group admin.');

        const grp     = database.getGroup(from);
        const current = !!grp.antisticker;
        const next    = !current;
        database.setGroup(from, 'antisticker', next);

        await reply(
            `🩷 *𝗔𝗡𝗧𝗜-𝗦𝗧𝗜𝗖𝗞𝗘𝗥* ⛧\n\n` +
            (next
                ? `✅ *ON* — _All stickers sent in this group will now be auto-deleted._\n_Admins and the bot owner are exempt._`
                : `🔴 *OFF* — _Stickers are allowed again._`) +
            `\n\n> _Sukuna MD · King of Curses_`
        );
    },
};
