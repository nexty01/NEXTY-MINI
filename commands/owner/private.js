/** Private Command — only the owner and configured sudo users get any response. Owner only. */
'use strict';
const { setModeReply } = require('./mode');

module.exports = {
    name: 'private',
    aliases: ['selfmode'],
    description: 'Set bot to private mode (owner + sudo only) — owner only',
    usage: '.private',
    category: 'owner',
    ownerOnly: true,
    async execute(ctx) { return setModeReply(ctx, 'private'); },
};
