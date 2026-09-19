/**
 * unsetcmd — Remove a bot command binding from a sticker.
 * Usage: Reply to a sticker with  .unsetcmd
 */

'use strict';

const database = require('../../utils/database');

module.exports = {
    name:        'unsetcmd',
    aliases:     ['removecmd', 'unbindcmd', 'delcmd', 'deletecmd'],
    description: 'Remove the bot command bound to a sticker',
    usage:       '.unsetcmd  (reply to the target sticker)',
    category:    'general',

    async execute({ sock, msg, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (!ctx) {
            return reply('❌ Please *reply to a sticker* with .unsetcmd to remove its binding.');
        }

        let stickerHash = null;

        const inline = ctx?.quotedMessage?.stickerMessage;
        if (inline) {
            const id = inline.fileSha256 || inline.fileEncSha256;
            if (id) stickerHash = Buffer.from(id).toString('base64');
        }

        if (!stickerHash) {
            try {
                const loaded = await sock.loadMessage(ctx.remoteJid || from, ctx.stanzaId);
                const sd     = loaded?.message?.stickerMessage;
                if (sd) {
                    const id = sd.fileSha256 || sd.fileEncSha256;
                    if (id) stickerHash = Buffer.from(id).toString('base64');
                }
            } catch (_) {}
        }

        if (!stickerHash) {
            return reply('❌ The quoted message is not a sticker. Please reply to a sticker.');
        }

        const existing = database.getStickerCmd(from, stickerHash);
        if (!existing) {
            return reply('⚠️ This sticker has no command binding. Nothing to remove.');
        }

        const deleted = database.deleteStickerCmd(from, stickerHash);

        if (deleted) {
            reply(
                '🗑️ *Sticker Command Removed!*\n\n' +
                `The binding to \`.${existing}\` has been deleted.\n\n` +
                'This sticker will no longer trigger any bot command.\n\n' +
                '_Use .setcmd (reply to a sticker) to create a new binding._'
            );
        } else {
            reply('❌ Failed to remove the binding. Please try again.');
        }
    },
};
