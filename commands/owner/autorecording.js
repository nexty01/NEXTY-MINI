/**
 * AutoRecording Command — Bot shows "recording audio..." on every incoming chat
 * Usage: .autorecording on | off | status
 * Owner-only. The owner is identified by the paired bot number automatically.
 */

const database = require('../../utils/database');

module.exports = {
    name: 'autorecording',
    aliases: ['autorecord', 'recordmode'],
    description: 'Make the bot show "recording audio..." on every incoming chat',
    category: 'owner',   // sessionManager already blocks non-owners at category level

    async execute({ reply, args, phoneNumber }) {
        // Note: sessionManager gates this command via category: 'owner'
        // so by the time we reach here, sender IS confirmed as owner.
        const action  = (args[0] || '').toLowerCase();
        const current = database.getAutoRecording(phoneNumber);

        if (!action || action === 'status') {
            return reply(
                '🎙️ *Auto-Recording*\n\n' +
                `Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
                '*Usage:*\n' +
                '• .autorecording on     — Show "recording audio..." on every chat\n' +
                '• .autorecording off    — Disable\n' +
                '• .autorecording status — Show current state\n\n' +
                '_When ON, everyone who messages the bot sees "recording audio..." instantly._'
            );
        }

        if (['on', 'enable', '1'].includes(action)) {
            // Mutually exclusive with auto-typing
            if (database.getAutoTyping(phoneNumber)) {
                database.setAutoTyping(phoneNumber, false);
            }
            database.setAutoRecording(phoneNumber, true);
            return reply(
                '✅ *Auto-Recording ENABLED*\n\n' +
                '🎙️ The bot will now show "recording audio..." to every person who messages it.\n\n' +
                '_Auto-typing was disabled — only one presence mode can be active at a time._'
            );
        }

        if (['off', 'disable', '0'].includes(action)) {
            database.setAutoRecording(phoneNumber, false);
            return reply('❌ *Auto-Recording DISABLED*\n\nThe bot will no longer show recording indicator.');
        }

        return reply('❓ Usage: `.autorecording on | off | status`');
    }
};
