/**
 * Crypto Command
 * Usage: .crypto <symbol>
 */

const axios = require('axios');

module.exports = {
    name: 'crypto',
    aliases: ['coin', 'price'],
    description: 'Get real-time cryptocurrency price',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const symbol = args[0]?.toLowerCase() || 'bitcoin';
        
        try {
            const res = await axios.get(`https://api.coingecko.com/api/v3/simple/price?ids=${symbol}&vs_currencies=usd,eur&include_24hr_change=true`);
            const data = res.data[symbol];

            if (!data) {
                return reply(`❌ Could not find data for "${symbol}". Try full names like "bitcoin" or "ethereum".`);
            }

            const caption = `🪙 *Crypto Price Info: ${symbol.toUpperCase()}*\n\n` +
                `💵 *USD:* $${data.usd.toLocaleString()}\n` +
                `💶 *EUR:* €${data.eur.toLocaleString()}\n` +
                `📈 *24h Change:* ${data.usd_24h_change.toFixed(2)}%`;

            reply(caption);
        } catch (err) {
            console.error('[crypto]', err.message);
            reply('❌ Failed to fetch crypto price. Please try again later.');
        }
    }
};
