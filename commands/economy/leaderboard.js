/**
 * Leaderboard — top 10 mentioning real WhatsApp numbers.
 */
const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');

module.exports = {
    name: 'leaderboard',
    aliases: ['lb', 'richlist'],
    description: 'View the top richest players',
    category: 'economy',
    async execute({ sock, msg, from, reply }) {
        try {
            const lb = economy.getLeaderboard(10);
            if (!lb.length) return reply(`💰 *Leaderboard*\n\nNo players found yet. Start earning with .daily, .work, .fish etc!`);
            const medals = ['🥇','🥈','🥉','4️⃣','5️⃣','6️⃣','7️⃣','8️⃣','9️⃣','🔟'];
            const mentions = lb.map(e => `${e.id.split('@')[0]}@s.whatsapp.net`);
            const list = lb.map((p, i) => {
                const num = p.id.split('@')[0];
                return `${medals[i]} @${num}\n   ${SYMBOL} ${p.total.toLocaleString()} ${CURRENCY}`;
            }).join('\n\n');
            await sock.sendMessage(from, {
                text: `🏆 *Economy Leaderboard*\n\n${list}\n\n_Total wealth = Wallet + Bank_`,
                mentions,
            }, { quoted: msg });
        } catch (e) {
            console.error('[leaderboard]', e.message);
            reply(`💰 *Leaderboard*\n\nLeaderboard data is being compiled. Use .balance to check your own wealth!`);
        }
    }
};
