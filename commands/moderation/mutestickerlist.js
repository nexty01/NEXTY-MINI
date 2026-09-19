/**
 * MuteStickerList Command — Show all blocked stickers
 * Usage: .mutestickerlist
 */

const database = require('../../utils/database');

module.exports = {
    name: 'mutestickerlist',
    aliases: ['blockedstickers', 'stickerblocklist'],
    description: 'Show all blocked stickers in the group',
    category: 'moderation',
    async execute({ reply, isGroup, database }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        try {
            const blockedStickers = database.getBlockedStickers(from);
            
            if (!blockedStickers || blockedStickers.length === 0) {
                return reply(
                    `🚫 *Blocked Stickers*\n\n` +
                    `No stickers are currently blocked in this group.`
                );
            }

            let response = `🚫 *Blocked Stickers*\n\n`;
            response += `Total blocked: ${blockedStickers.length}\n\n`;
            response += `To unblock a sticker, reply to it with .unmutesticker`;

            reply(response);

        } catch (err) {
            console.error('[MuteStickerList Error]', err);
            reply('❌ An error occurred while fetching the blocked sticker list.');
        }
    }
};
