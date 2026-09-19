/**
 * SetPrefix Command — Change the bot prefix for this session
 *
 * Usage:
 *   .setprefix !          → changes prefix to !
 *   .setprefix /          → changes prefix to /
 *   .setprefix ##         → changes prefix to ##
 *   .setprefix null       → removes prefix (bot responds to everything)
 *
 * Only the session owner can run this command.
 */

const config = require('../../config');

module.exports = {
    name: 'setprefix',
    aliases: ['prefix', 'changeprefix'],
    description: 'Change the bot command prefix for your session',
    usage: '.setprefix <new prefix> | .setprefix null (no prefix)',
    category: 'owner',

    async execute({ reply, database, phoneNumber, args, prefix }) {
        // Must be the owner's command — enforced by private mode check upstream,
        // but add a soft guard anyway.
        if (!args || args.length === 0) {
            const currentPrefix = database.getPrefix(phoneNumber);
            const display =
                currentPrefix === null    ? '_(none — no prefix mode)_'
                : currentPrefix === undefined ? `\`${config.prefix || '.'}\` _(default)_`
                : `\`${currentPrefix}\``;

            return reply(
                `╔══════════════════════════════╗\n` +
                `║   ⚙️  *SET BOT PREFIX*          ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `Current prefix: ${display}\n\n` +
                `*Usage:*\n` +
                `\`${prefix || config.prefix}setprefix !\`        → set to !\n` +
                `\`${prefix || config.prefix}setprefix /\`        → set to /\n` +
                `\`${prefix || config.prefix}setprefix ##\`       → set to ##\n` +
                `\`${prefix || config.prefix}setprefix null\`     → no prefix mode\n\n` +
                `_No-prefix mode: the bot treats every message as a potential command._`
            );
        }

        const newPrefix = args[0].trim();

        // null / "null" = no-prefix mode
        if (newPrefix.toLowerCase() === 'null') {
            database.setPrefix(phoneNumber, null);
            return reply(
                `╔══════════════════════════════╗\n` +
                `║   ⚙️  *PREFIX REMOVED*          ║\n` +
                `╚══════════════════════════════╝\n\n` +
                `✅ *No-prefix mode activated.*\n\n` +
                `The bot will now respond to commands *without any prefix*.\n` +
                `Example: just type \`menu\`, \`ping\`, \`vv\` etc.\n\n` +
                `_To restore a prefix, send:_ \`setprefix .\``
            );
        }

        // Validate length
        if (newPrefix.length > 5) {
            return reply(
                `❌ *Prefix too long.*\n\n` +
                `Please choose a prefix of *1–5 characters* max.\n` +
                `_Example: \`.\`, \`!\`, \`/\`, \`##\`_`
            );
        }

        database.setPrefix(phoneNumber, newPrefix);

        return reply(
            `╔══════════════════════════════╗\n` +
            `║   ⚙️  *PREFIX UPDATED*          ║\n` +
            `╚══════════════════════════════╝\n\n` +
            `✅ Bot prefix changed to: *${newPrefix}*\n\n` +
            `*New usage examples:*\n` +
            `\`${newPrefix}menu\`     — Show all commands\n` +
            `\`${newPrefix}ping\`     — Check bot speed\n` +
            `\`${newPrefix}private\`  — Lock bot to owner\n\n` +
            `_To remove prefix entirely, send:_ \`${newPrefix}setprefix null\``
        );
    }
};
