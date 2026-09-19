/**
 * AutoTyping Command — Bot shows "typing..." on every incoming chat
 * Usage: .autotyping on | off | status
 * Owner-only. The owner is identified by the paired bot number automatically.
 */

const database = require('../../utils/database');

module.exports = {
    name: 'autotyping',
    aliases: ['autotype', 'typingmode'],
    description: 'Make the bot show "typing..." on every incoming chat',
    category: 'owner',   // sessionManager already blocks non-owners at category level

    async execute({ reply, args, phoneNumber }) {
        // Note: sessionManager gates this command via category: 'owner'
        // so by the time we reach here, sender IS confirmed as owner.
        const action  = (args[0] || '').toLowerCase();
        const current = database.getAutoTyping(phoneNumber);

        if (!action || action === 'status') {
            return reply(
                '⌨️ *Auto-Typing*\n\n' +
                `Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
                '*Usage:*\n' +
                '• .autotyping on     — Show "typing..." on every chat\n' +
                '• .autotyping off    — Disable\n' +
                '• .autotyping status — Show current state\n\n' +
                '_When ON, everyone who messages the bot sees "typing..." instantly._'
            );
        }

        if (['on', 'enable', '1'].includes(action)) {
            // Mutually exclusive with auto-recording
            if (database.getAutoRecording(phoneNumber)) {
                database.setAutoRecording(phoneNumber, false);
            }
            database.setAutoTyping(phoneNumber, true);
            return reply(
                '✅ *Auto-Typing ENABLED*\n\n' +
                '⌨️ The bot will now show "typing..." to every person who messages it.\n\n' +
                '_Auto-recording was disabled — only one presence mode can be active at a time._'
            );
        }

        if (['off', 'disable', '0'].includes(action)) {
            database.setAutoTyping(phoneNumber, false);
            return reply('❌ *Auto-Typing DISABLED*\n\nThe bot will no longer show typing indicator.');
        }

        return reply('❓ Usage: `.autotyping on | off | status`');
    }
};
