/**
 * Private Command — Lock bot to paired number only
 * Usage: .private
 */

module.exports = {
    name: 'private',
    aliases: ['selfmode', 'lock'],
    description: 'Set bot to private mode — only the paired number can use commands',
    usage: '.private',
    category: 'owner',

    async execute({ reply, database, phoneNumber }) {
        if (!phoneNumber) {
            return reply('⚠️ Session not ready — phone number missing. Try again in a moment.');
        }

        if (database.getSelfMode(phoneNumber)) {
            return reply(`🔒 Already *PRIVATE*. Use *.public* to open.`);
        }

        // Flip the mode. setSelfMode already persists to disk —
        // do NOT also overwrite ownerNumber here: getOwnerNumber()
        // falls back to phoneNumber by default, and overwriting it
        // clobbers any legitimate owner already stored (which then
        // breaks .public for the real owner).
        database.setSelfMode(phoneNumber, true);

        reply(`🔒 *PRIVATE MODE ON* — owner only.\n_Use *.public* to reopen._`);
    }
};
