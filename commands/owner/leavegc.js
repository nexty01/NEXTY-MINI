'use strict';

module.exports = {
    name: 'leavegc',
    aliases: ['exit', 'leave', 'bye'],
    category: 'Owner',
    desc: 'Leave the current group',
    ownerOnly: true,
    reactions: {
        start: '👋',
        success: '🚪'
    },

    execute: async (context) => {
        try {
            const { sock, from, reply } = context;

            if (!from || !from.includes('@')) {
                return reply('Group only');
            }

            // Send goodbye message
            await reply('`×͜×⟁⃝ GOODBYE! ℘`', { raw: true });

            // Small delay to ensure message sends before leaving
            await new Promise(r => setTimeout(r, 1000));

            // Leave the group
            await sock.groupLeave(from);

            console.log(`[LEAVEGC] Successfully left group: ${from}`);

        } catch (err) {
            console.error('[LEAVEGC ERROR]', err.message);

            const errMsg = err.toString().toLowerCase();
            let reason = 'Unknown error';

            if (errMsg.includes('not authorized')) {
                reason = 'Not authorized to leave this group';
            } else if (errMsg.includes('not participant')) {
                reason = 'Not a participant of this group';
            } else if (errMsg.includes('timeout') || errMsg.includes('408')) {
                reason = 'Request timed out - try again';
            } else if (errMsg.includes('500')) {
                reason = 'WhatsApp server error - try again later';
            } else if (err.message) {
                reason = err.message.substring(0, 100);
            }

            context?.reply?.(`✘ Failed to leave group\n${reason}`);
        }
    }
};
