/**
 * Anti-Delete — recovers and re-posts deleted messages in a group
 * Recovers text, images, videos, audio, documents and stickers
 * Usage: .antidelete  (toggles on/off, admin only)
 */
'use strict';

const database = require('../../utils/database');

module.exports = {
    name:        'antidelete',
    aliases:     ['ad', 'antirevoke'],
    category:    'moderation',
    description: 'Recover deleted messages in group',
    usage:       '.antidelete',

    async execute({ sock, from, msg, isGroup, isAdmin, isOwner, reply }) {
        if (!isGroup)             return reply(`❌ _This command only works in groups._`);
        if (!isAdmin && !isOwner) return reply(`❌ _Only admins can use this command._`);

        const grp     = database.getGroup(from);
        const current = !!grp.antidelete;
        const next    = !current;
        database.setGroup(from, 'antidelete', next);

        await reply(
            `🗑️ *𝗔𝗡𝗧𝗜-𝗗𝗘𝗟𝗘𝗧𝗘* ⛧\n\n` +
            (next
                ? `✅ *ON* — _𝘐 𝘸𝘪𝘭𝘭 𝘳𝘦𝘤𝘰𝘷𝘦𝘳 𝘢𝘯𝘺 𝘮𝘦𝘴𝘴𝘢𝘨𝘦 𝘥𝘦𝘭𝘦𝘵𝘦𝘥 𝘪𝘯 𝘵𝘩𝘪𝘴 𝘨𝘳𝘰𝘶𝘱._\n_𝘛𝘦𝘹𝘵, 𝘪𝘮𝘢𝘨𝘦𝘴, 𝘷𝘪𝘥𝘦𝘰𝘴, 𝘢𝘶𝘥𝘪𝘰 𝘢𝘯𝘥 𝘥𝘰𝘤𝘴 𝘢𝘳𝘦 𝘢𝘭𝘭 𝘤𝘰𝘷𝘦𝘳𝘦𝘥._`
                : `🔴 *OFF* — _𝘈𝘯𝘵𝘪-𝘋𝘦𝘭𝘦𝘵𝘦 𝘩𝘢𝘴 𝘣𝘦𝘦𝘯 𝘥𝘪𝘴𝘢𝘣𝘭𝘦𝘥._`) +
            `\n\n> _𝘚𝘶𝘬𝘶𝘯𝘢 𝘔𝘋 · 𝘒𝘪𝘯𝘨 𝘰𝘧 𝘊𝘶𝘳𝘴𝘦𝘴_`
        );
    }
};
