const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'invest',
    aliases: ['investment', 'stocks'],
    description: 'Invest your coins for potential returns',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const cd = economy.checkCooldown(sender, 'invest');
        if (cd.onCooldown) return reply(`📈 Your investment matures in *${formatTime(cd.remaining)}*!`);
        if (!args.length || isNaN(args[0])) return reply(
            `📈 *Investment*\n\nUsage: .invest <amount>\n\nInvest your coins for a chance at 1.5x–3x returns!\nRisk: 20% chance of losing 30% of investment.\n\nCooldown: 6 hours per investment.`
        );
        const amount = parseInt(args[0]);
        if (amount < 100) return reply(`❌ Minimum investment is *100 ${CURRENCY}*.`);
        const bal = economy.getBalance(sender);
        if (bal.wallet < amount) return reply(`❌ Insufficient funds!\nWallet: *${bal.wallet.toLocaleString()}*\nRequired: *${amount.toLocaleString()}*`);
        economy.removeWallet(sender, amount);
        economy.setCooldown(sender, 'invest', 21600000); // 6 hours
        const roll = Math.random();
        let multiplier, outcome;
        if (roll < 0.2) { multiplier = 0.7; outcome = `📉 *Market Crash!* Lost 30%.`; }
        else if (roll < 0.5) { multiplier = 1.5; outcome = `📈 *Steady growth!* 1.5x return.`; }
        else if (roll < 0.8) { multiplier = 2.0; outcome = `🚀 *Great returns!* 2x profit!`; }
        else { multiplier = 3.0; outcome = `💎 *Jackpot investment!* 3x return!`; }
        const returns = Math.floor(amount * multiplier);
        const profit = returns - amount;
        economy.addWallet(sender, returns);
        const newBal = economy.getBalance(sender);
        reply(
            `📊 *Investment Results*\n\n` +
            `${outcome}\n\n` +
            `💵 Invested: *${amount.toLocaleString()} ${CURRENCY}*\n` +
            `${profit >= 0 ? '✅' : '❌'} ${profit >= 0 ? 'Profit' : 'Loss'}: *${Math.abs(profit).toLocaleString()} ${CURRENCY}*\n` +
            `💰 Returned: *${returns.toLocaleString()} ${CURRENCY}*\n\n` +
            `👛 Wallet: *${newBal.wallet.toLocaleString()}*\n_Next investment in 6 hours!_`
        );
    }
};
