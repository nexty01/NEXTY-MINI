/**
 * MuteList Command — Show all muted users in the group
 * Usage: .mutelist
 */

const database = require('../../utils/database');

function formatTimeRemaining(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
}

module.exports = {
    name: 'mutelist',
    aliases: ['mutedusers', 'listmutes'],
    description: 'Show all muted users in the group',
    category: 'moderation',
    async execute({ reply, isGroup, from, database }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        try {
            const mutedUsers = database.getMutedUsers(from);
            
            if (!mutedUsers || Object.keys(mutedUsers).length === 0) {
                return reply(
                    `🔇 *Muted Users*\n\n` +
                    `No users are currently muted in this group.`
                );
            }

            const now = Date.now();
            let response = `🔇 *Muted Users*\n\n`;
            let count = 0;
            const mentions = [];

            for (const [userId, expiresAt] of Object.entries(mutedUsers)) {
                const timeRemaining = expiresAt - now;
                if (timeRemaining > 0) {
                    const userNumber = userId.split('@')[0];
                    response += `${++count}. @${userNumber}\n`;
                    response += `   ⏱️ Remaining: ${formatTimeRemaining(timeRemaining)}\n\n`;
                    mentions.push(userId);
                }
            }

            if (count === 0) {
                return reply(
                    `🔇 *Muted Users*\n\n` +
                    `No users are currently muted in this group.`
                );
            }

            response += `Use .unmuteuser @user to unmute a user.`;
            reply(response);

        } catch (err) {
            console.error('[MuteList Error]', err);
            reply('❌ An error occurred while fetching the mute list.');
        }
    }
};
