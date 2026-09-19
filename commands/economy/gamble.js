const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'gamble',
    aliases: ['coinflip', 'cf', 'bet'],
    description: 'Gamble your PASQUA Bucks on a coin flip',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const bal = economy.getBalance(sender);
        const amount = args[0] === 'all' ? bal.wallet : parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`❌ Usage: \`.gamble <amount>\`\n\nExample: \`.gamble 500\` or \`.gamble all\``);
        if (amount > bal.wallet) return reply(`❌ You only have *${bal.wallet.toLocaleString()} ${CURRENCY}* in your wallet!`);
        
        let winChance = 0.5;
        if (economy.hasActiveEffect(sender, 'luckycharm')) winChance += 0.15;
        
        const won = Math.random() < winChance;
        if (won) {
            economy.addWallet(sender, amount);
            reply(`🪙 *COIN FLIP*\n\nThe coin lands on... *HEADS!* ✅\n\n🎉 You won *${amount.toLocaleString()} ${CURRENCY}*!\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`);
        } else {
            economy.removeWallet(sender, amount);
            reply(`🪙 *COIN FLIP*\n\nThe coin lands on... *TAILS!* ❌\n\n😢 You lost *${amount.toLocaleString()} ${CURRENCY}*!\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`);
        }
    }
};
