/**
 * Richest — top 10 by total wealth, mentioning real user numbers.
 */
const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');

module.exports = {
    name: 'richest',
    aliases: ['rich', 'top'],
    description: 'View the top 10 richest users',
    category: 'economy',
    async execute({ sock, msg, from, reply }) {
        const lb = economy.getLeaderboard(10);
        if (!lb.length) {
            return reply(`🏆 *LEADERBOARD*\n\n_No one has earned any ${CURRENCY} yet!_`);
        }
        const medals = ['🥇', '🥈', '🥉'];
        const mentions = lb.map(e => `${e.id.split('@')[0]}@s.whatsapp.net`);
        let text = `🏆 *RICHEST USERS* 🏆\n━━━━━━━━━━━━━━━━━━━━━\n\n`;
        lb.forEach((e, i) => {
            const medal = medals[i] || `#${i + 1}`;
            const num   = e.id.split('@')[0];
            text += `${medal} @${num} — *${e.total.toLocaleString()} ${CURRENCY}*\n`;
        });
        text += `\n━━━━━━━━━━━━━━━━━━━━━\n_Grind harder to reach the top!_ 💪`;
        await sock.sendMessage(from, { text, mentions }, { quoted: msg });
    }
};
