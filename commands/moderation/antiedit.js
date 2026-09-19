/**
 * Anti-Edit — detects and exposes edited messages in a group
 * Usage: .antiedit  (toggles on/off, admin only)
 */
'use strict';

const database = require('../../utils/database');

module.exports = {
    name:        'antiedit',
    aliases:     ['ae'],
    category:    'moderation',
    description: 'Reveal original message when someone edits in group',
    usage:       '.antiedit',

    async execute({ sock, from, msg, isGroup, isAdmin, isOwner, reply }) {
        if (!isGroup)           return reply(`❌ _This command only works in groups._`);
        if (!isAdmin && !isOwner) return reply(`❌ _Only admins can use this command._`);

        const grp     = database.getGroup(from);
        const current = !!grp.antiedit;
        const next    = !current;
        database.setGroup(from, 'antiedit', next);

        await reply(
            `✏️ *𝗔𝗡𝗧𝗜-𝗘𝗗𝗜𝗧* ⛧\n\n` +
            (next
                ? `✅ *ON* — _𝘐 𝘸𝘪𝘭𝘭 𝘯𝘰𝘸 𝘦𝘹𝘱𝘰𝘴𝘦 𝘦𝘷𝘦𝘳𝘺 𝘦𝘥𝘪𝘵𝘦𝘥 𝘮𝘦𝘴𝘴𝘢𝘨𝘦 𝘪𝘯 𝘵𝘩𝘪𝘴 𝘨𝘳𝘰𝘶𝘱._\n_𝘖𝘳𝘪𝘨𝘪𝘯𝘢𝘭 + 𝘦𝘥𝘪𝘵𝘦𝘥 𝘵𝘦𝘹𝘵 𝘸𝘪𝘭𝘭 𝘣𝘰𝘵𝘩 𝘣𝘦 𝘴𝘩𝘰𝘸𝘯._`
                : `🔴 *OFF* — _𝘈𝘯𝘵𝘪-𝘌𝘥𝘪𝘵 𝘩𝘢𝘴 𝘣𝘦𝘦𝘯 𝘥𝘪𝘴𝘢𝘣𝘭𝘦𝘥._`) +
            `\n\n> _𝘚𝘶𝘬𝘶𝘯𝘢 𝘔𝘋 · 𝘒𝘪𝘯𝘨 𝘰𝘧 𝘊𝘶𝘳𝘴𝘦𝘴_`
        );
    }
};
