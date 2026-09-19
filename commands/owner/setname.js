/**
 * Setname — Change the bot's WhatsApp profile NAME (display name).
 * Updates the actual WhatsApp account name shown to everyone in chats.
 * Usage: .setname <new name>
 * Owner only.
 */
'use strict';

module.exports = {
    name: 'setname',
    aliases: ['setbotname', 'wname'],
    description: "Change the bot's WhatsApp display name",
    category: 'owner',

    async execute({ sock, args, reply, isOwner }) {
        if (!isOwner) return reply('❌ Only the bot owner can use this command.');

        const name = args.join(' ').trim();
        if (!name)             return reply('❌ Usage: *.setname <new name>*');
        if (name.length > 25)  return reply('❌ Name too long (WhatsApp max is 25 characters).');

        try {
            await reply('⏳ Updating WhatsApp profile name...');
            await sock.updateProfileName(name);
            await reply(
                `╭─❒ ◈ 𝙎𝙐𝙆𝙐᳇𝘼 ❒\n` +
                `│ ✅ *WhatsApp name updated!*\n` +
                `│ 👤 New name: *${name}*\n` +
                `╰─⛧ pasqua verified`
            );
        } catch (e) {
            console.error('[setname]', e.message);
            await reply(`❌ Failed to update WhatsApp name.\n_Reason: ${e.message}_`);
        }
    },
};
