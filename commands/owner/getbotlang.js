/**
 * getbotlang — Show the current bot language for this session.
 * Usage: .getbotlang
 */

'use strict';

const database   = require('../../utils/database');
const langSystem = require('../../utils/langSystem');

module.exports = {
    name:        'getbotlang',
    aliases:     ['currentlang', 'mylang'],
    description: 'Show the current bot language',
    usage:       '.getbotlang',
    category:    'owner',

    async execute({ reply, phoneNumber }) {
        const current = database.getLanguage(phoneNumber);
        const t       = langSystem.getTranslator(current);

        reply(
            t('lang.current', { lang: current.charAt(0).toUpperCase() + current.slice(1) }) +
            '\n\n*Available languages:*\n' +
            langSystem.AVAILABLE
                .map(l => {
                    const label = l.charAt(0).toUpperCase() + l.slice(1);
                    return (l === current ? '✅ ' : '  • ') + label;
                })
                .join('\n') +
            '\n\n_Use .setbotlang <language> to change._'
        );
    },
};
