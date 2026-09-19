/**
 * setbotlang — Change the bot's language for this session.
 *
 * Usage: .setbotlang <language>
 * Examples:
 *   .setbotlang french
 *   .setbotlang english
 *   .setbotlang spanish
 *   .setbotlang portuguese
 */

'use strict';

const database   = require('../../utils/database');
const langSystem = require('../../utils/langSystem');

module.exports = {
    name:        'setbotlang',
    aliases:     ['setlang', 'botlang', 'changelang'],
    description: 'Change the bot language for all responses',
    usage:       '.setbotlang <language>',
    category:    'owner',

    async execute({ reply, args, phoneNumber, isOwner, t: _t }) {
        // Use the language translator passed from sessionManager (reflects current lang)
        const t = _t || langSystem.getTranslator('english');

        if (!isOwner) return reply(t('general.ownerOnly'));
        const input = args[0]?.toLowerCase().trim();

        if (!input) {
            const current = database.getLanguage(phoneNumber);
            return reply(
                '🌍 *Bot Language System*\n\n' +
                `Current language: *${current.charAt(0).toUpperCase() + current.slice(1)}*\n\n` +
                '*Available languages:*\n' +
                langSystem.AVAILABLE
                    .map(l => `  • ${l.charAt(0).toUpperCase() + l.slice(1)}`)
                    .join('\n') + '\n\n' +
                '*Usage:* `.setbotlang <language>`\n' +
                '_Example:_ `.setbotlang french`'
            );
        }

        if (!langSystem.isValid(input)) {
            return reply(
                '❌ Unknown language: *' + input + '*\n\n' +
                '*Available languages:* ' + langSystem.availableList() + '\n\n' +
                '_Example:_ `.setbotlang french`'
            );
        }

        const current = database.getLanguage(phoneNumber);
        const norm    = langSystem.normalise(input);

        if (current === norm) {
            return reply(
                '⚠️ Language is already set to *' +
                norm.charAt(0).toUpperCase() + norm.slice(1) + '*. No changes made.'
            );
        }

        database.setLanguage(phoneNumber, norm);

        // Confirm in the NEW language so the change is immediately visible
        const tNew = langSystem.getTranslator(norm);
        reply(
            tNew('lang.set', { lang: norm.charAt(0).toUpperCase() + norm.slice(1) }) +
            '\n\n_Use .getbotlang to check the current language._'
        );
    },
};
