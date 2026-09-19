const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'taxes',
    aliases: ['tax', 'taxtip'],
    description: 'View economy tax info and tips',
    category: 'economy',
    async execute({ reply, sender }) {
        const bal = economy.getBalance(sender);
        const total = (bal.wallet||0)+(bal.bank||0);
        reply(
            `🏛️ *Economy Tax Info*\n\n` +
            `💰 Your Net Worth: *${total.toLocaleString()} ${CURRENCY}*\n\n` +
            `📊 *Economy Tips*\n` +
            `• Keep savings in the 🏦 bank to earn interest\n` +
            `• Don't keep large amounts in your wallet (robbery risk)\n` +
            `• Use .daily, .work, .fish, .mine, .hunt regularly\n` +
            `• Try .spin every 4 hours for free coins\n` +
            `• Play .slots, .roulette for big wins\n` +
            `• Use .deposit to protect your coins\n\n` +
            `💡 *Wealth Tiers*\n` +
            `🥉 Beginner: 0 – 4,999\n` +
            `🔵 Bronze: 5,000 – 19,999\n` +
            `🥈 Silver: 20,000 – 49,999\n` +
            `🥇 Gold: 50,000 – 99,999\n` +
            `💎 Diamond: 100,000+`
        );
    }
};
