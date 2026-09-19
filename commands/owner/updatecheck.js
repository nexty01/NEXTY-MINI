'use strict';

/**
 * updatecheck — shorthand for `.update check`.
 *
 * Shows what's pending (local vs remote commit, changed file count) without
 * touching a single file. Thin wrapper around update.js's existing check
 * mode so there's only one code path that ever decides what "up to date"
 * means — this command just can't pass anything except 'check' as the mode,
 * so it's structurally incapable of pulling or applying anything.
 */

const updateCommand = require('./update');

module.exports = {
    name: 'updatecheck',
    aliases: ['checkupdate', 'updatestatus'],
    description: "Show pending updates without applying them (owner only)",
    category: 'owner',
    ownerOnly: true,

    async execute(context) {
        return updateCommand.execute({ ...context, args: ['check'] });
    },
};
