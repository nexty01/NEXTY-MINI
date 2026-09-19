/**
 * Public Command — Open bot to everyone
 * Usage: .public
 */

module.exports = {
    name: 'public',
    aliases: ['everyone', 'unlock'],
    description: 'Set bot to public mode — everyone can use commands',
    usage: '.public',
    category: 'owner',

    async execute({ reply, database, phoneNumber }) {
        if (!phoneNumber) {
            return reply('⚠️ Session not ready — phone number missing. Try again in a moment.');
        }

        if (!database.getSelfMode(phoneNumber)) {
            return reply(`🌍 Already *PUBLIC*. Use *.private* to lock.`);
        }

        database.setSelfMode(phoneNumber, false);
        reply(`🌍 *PUBLIC MODE ON* — everyone can use commands.\n_Use *.private* to lock._`);
    }
};
