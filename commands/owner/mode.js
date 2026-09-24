/**
 * Mode Command — switch the bot between private and public access.
 *   .mode              → show the real current mode
 *   .mode private      → ONLY the real owner and configured sudo users get any response
 *   .mode public       → everyone (subject to each command's own permissions)
 *
 * OWNER ONLY. Mods, sudo users, group admins and normal users can never change it.
 * State lives in ONE bot-wide place (lib/access → utils/database settings.privateMode).
 */
'use strict';

const access = require('../../lib/access');

// Strict owner test: mods are never "owner" here, even if a caller mapped them to isOwner.
function isRealOwnerCtx({ isRealOwner, isOwner, isMod }) {
    if (typeof isRealOwner === 'boolean') return isRealOwner;
    return isOwner === true && isMod !== true;
}

async function setModeReply(ctx, requested) {
    const { reply } = ctx;
    if (!isRealOwnerCtx(ctx)) return reply('🔒 *Only the bot owner can change private/public mode.*');
    const next = access.parseMode(requested);
    if (!next) return null;
    let current;
    try { current = access.getMode(); } catch (_) { current = 'public'; }
    if (current === next) {
        return reply(next === 'private'
            ? '🔒 Already *PRIVATE*. Use *.public* to open.'
            : '🌍 Already *PUBLIC*. Use *.private* to lock.');
    }
    try {
        access.setMode(next);
    } catch (error) {
        return reply(`❌ Could not save mode: ${error.message}`);
    }
    // Verify it really persisted before claiming success.
    if (access.getMode() !== next) return reply('❌ Mode could not be saved. Nothing was changed.');
    return reply(next === 'private'
        ? '🔒 *PRIVATE MODE ON*\n\nOnly the owner and sudo users get any reply. Everyone else is ignored silently.\n_Use *.mode public* to reopen._'
        : '🌍 *PUBLIC MODE ON*\n\nEveryone can use commands (admin/owner/sudo commands keep their own permissions).\n_Use *.mode private* to restrict access._');
}

module.exports = {
    name: 'mode',
    aliases: ['botmode', 'setmode'],
    description: 'Set bot access mode: private or public (owner only)',
    category: 'owner',
    ownerOnly: true,
    setModeReply,
    isRealOwnerCtx,

    async execute(ctx) {
        const { reply, args } = ctx;
        if (!isRealOwnerCtx(ctx)) return reply('🔒 *Only the bot owner can change private/public mode.*');
        const handled = await setModeReply(ctx, args?.[0]);
        if (handled !== null) return handled;

        let current = 'public';
        try { current = access.getMode(); } catch (_) {}
        return reply(
            `⚙️ *Bot Mode*\n\nCurrent: *${current.toUpperCase()}*\n\n` +
            `• *.mode private* — only owner and sudo users get replies\n` +
            `• *.mode public* — everyone can use commands`
        );
    },
};
