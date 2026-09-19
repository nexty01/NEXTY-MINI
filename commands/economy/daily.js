const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'daily',
    aliases: ['claim'],
    description: 'Claim your daily PASQUA Bucks reward',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'daily');
        if (cd.onCooldown) return reply(`⏰ You already claimed your daily reward!\n\n⏳ Come back in *${formatTime(cd.remaining)}*`);
        const amount = Math.floor(Math.random() * 1501) + 500;
        economy.addWallet(sender, amount);
        economy.setCooldown(sender, 'daily');
        const b = economy.getBalance(sender);
        reply(`🎁 *DAILY REWARD CLAIMED!*\n\n${SYMBOL} You received *${amount.toLocaleString()} ${CURRENCY}*!\n\n👛 Wallet: *${b.wallet.toLocaleString()}*\n\n_Come back tomorrow for more!_ 🔄`);
    }
};
