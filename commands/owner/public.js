/** Public Command — open the bot to everyone (per-command permissions still apply). Owner only. */
'use strict';
const { setModeReply } = require('./mode');

module.exports = {
    name: 'public',
    aliases: ['unlockbot'],
    description: 'Set bot to public mode — owner only',
    usage: '.public',
    category: 'owner',
    ownerOnly: true,
    async execute(ctx) { return setModeReply(ctx, 'public'); },
};
