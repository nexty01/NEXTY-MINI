/**
 * Owner Command — vCard contact only
 * Usage: .owner
 */

'use strict';

const config = require('../../config');

module.exports = {
    name: 'owner',
    aliases: ['contact', 'creator', 'dev', 'ownerinfo'],
    description: 'Send bot owner as a vCard contact',
    category: 'owner',

    async execute({ sock, msg, from, reply }) {
        const ownerName   = config.owner?.name || 'PASQUA';
        const ownerNumber = '2349127814853';
        const botName     = config.botName     || 'SUKUNA MD';

        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${ownerName}`,
            `N:${ownerName};;;`,
            `ORG:${botName}`,
            `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}`,
            'URL:https://t.me/Pasquaking',
            `NOTE:${botName} Owner`,
            'END:VCARD'
        ].join('\n');

        try {
            await sock.sendMessage(from, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }],
                },
            }, { quoted: msg });
        } catch (e) {
            console.error('[OWNER CMD]', e.message);
            reply('❌ Failed to send owner contact.');
        }
    }
};
