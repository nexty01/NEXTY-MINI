/**
 * Setbio — Change the bot's WhatsApp "About" (status text).
 * Updates the About field shown on the bot's WhatsApp profile.
 * Usage: .setbio <new about>
 * Owner only.
 */
'use strict';

module.exports = {
    name: 'setbio',
    aliases: ['setabout', 'setstatus'],
    description: "Change the bot's WhatsApp About / status",
    category: 'owner',

    async execute({ sock, args, reply, isOwner }) {
        if (!isOwner) return reply('❌ Only the bot owner can use this command.');

        const bio = args.join(' ').trim();
        if (!bio)              return reply('❌ Usage: *.setbio <new about>*');
        if (bio.length > 139)  return reply('❌ About too long (WhatsApp max is 139 characters).');

        try {
            await reply('⏳ Updating WhatsApp About...');
            await sock.updateProfileStatus(bio);
            await reply(
                `╭─❒ ◈ 𝙎𝙐𝙆𝙐᳇𝘼 ❒\n` +
                `│ ✅ *WhatsApp About updated!*\n` +
                `│ 📝 ${bio}\n` +
                `╰─⛧ pasqua verified`
            );
        } catch (e) {
            console.error('[setbio]', e.message);
            await reply(`❌ Failed to update WhatsApp About.\n_Reason: ${e.message}_`);
        }
    },
};
