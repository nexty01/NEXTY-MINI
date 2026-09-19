/**
 * setcmd — Bind a bot command to a sticker.
 *
 * Usage: Reply to a sticker with  .setcmd <command>
 * Example: .setcmd ping
 *
 * Whenever anyone sends that sticker the bot executes the stored command.
 * Works ONLY when replying to a sticker — no sticker = no binding.
 */

'use strict';

const database     = require('../../utils/database');
const commandLoader = require('../../utils/commandLoader');

module.exports = {
    name:        'setcmd',
    aliases:     ['stickercmd', 'bindcmd'],
    description: 'Bind a bot command to a sticker',
    usage:       '.setcmd <command>  (reply to the target sticker)',
    category:    'general',

    async execute({ sock, msg, from, reply, args, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const commandName = args[0]?.toLowerCase().trim();
        if (!commandName) {
            return reply(
                '📌 *Set Sticker Command*\n\n' +
                'Reply to a sticker, then type:\n' +
                '*.setcmd <command name>*\n\n' +
                'Every time that sticker is sent the bot will auto-run the command.\n\n' +
                '_Example:_ *.setcmd ping*\n' +
                '_Example:_ *.setcmd alive*\n\n' +
                'Use *.unsetcmd* (reply to sticker) to remove.\n' +
                'Use *.cmdlist* to see all sticker bindings.'
            );
        }

        // Verify the command exists in the bot
        const targetCmd = commandLoader.getCommand(commandName);
        if (!targetCmd) {
            return reply(
                '❌ Unknown command: *' + commandName + '*\n\n' +
                'Make sure you use a valid command name without the prefix.\n' +
                '_Example:_ `.setcmd ping` (not `.setcmd .ping`)'
            );
        }

        // ── Extract sticker hash from the quoted message ─────────────────────
        const ctx = msg.message?.extendedTextMessage?.contextInfo;
        if (!ctx) {
            return reply('❌ Please *reply to a sticker* with .setcmd <command>');
        }

        let stickerHash = null;

        // Try inline quoted message first
        const inline = ctx?.quotedMessage?.stickerMessage;
        if (inline) {
            const id = inline.fileSha256 || inline.fileEncSha256;
            if (id) stickerHash = Buffer.from(id).toString('base64');
        }

        // Fall back to loading the full quoted message
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

        // ── Save to DB & confirm ─────────────────────────────────────────────
        const existing = database.getStickerCmd(from, stickerHash);
        database.setStickerCmd(from, stickerHash, commandName);

        if (existing) {
            reply(
                '✏️ *Sticker Command Updated!*\n\n' +
                `Old: \`${existing}\`\n` +
                `New: \`${commandName}\`\n\n` +
                'Sending this sticker will now trigger *.' + commandName + '*.'
            );
        } else {
            reply(
                '✅ *Sticker Command Set!*\n\n' +
                `Command: \`.${commandName}\`\n\n` +
                'Whenever this sticker is sent, the bot will automatically run *.' + commandName + '*.\n\n' +
                '_Use .unsetcmd (reply to sticker) to remove it._'
            );
        }
    },
};
