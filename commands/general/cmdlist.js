/**
 * cmdlist — List all sticker → command bindings in this group.
 * Usage: .cmdlist
 */

'use strict';

const database = require('../../utils/database');

module.exports = {
    name:        'cmdlist',
    aliases:     ['stickerlist', 'bindlist'],
    description: 'List all sticker-command bindings in this group',
    usage:       '.cmdlist',
    category:    'general',

    async execute({ from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        const all = database.getAllStickerCmds(from);
        const entries = Object.entries(all);

        if (entries.length === 0) {
            return reply(
                '📋 *Sticker Command List*\n\n' +
                'No sticker bindings set in this group yet.\n\n' +
                '_Use .setcmd <command> (reply to a sticker) to create one._'
            );
        }

        const lines = entries.map(([ , cmd], i) =>
            `${i + 1}. Sticker → \`.${cmd}\``
        ).join('\n');

        reply(
            '📋 *Sticker Command Bindings*\n\n' +
            lines + '\n\n' +
            `Total: *${entries.length}* binding${entries.length === 1 ? '' : 's'}\n\n` +
            '_Reply to a sticker with .unsetcmd to remove a binding._'
        );
    },
};
