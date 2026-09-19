const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'edice',
    aliases: ['dicebet', 'rolldice'],
    description: 'Roll dice against the bot for PASQUA Bucks',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const amount = args[0] === 'all' ? economy.getBalance(sender).wallet : parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`❌ Usage: \`.edice <amount>\``);
        if (amount > economy.getBalance(sender).wallet) return reply(`❌ Not enough ${CURRENCY}!`);
        
        const yours = Math.floor(Math.random() * 6) + 1;
        const bot = Math.floor(Math.random() * 6) + 1;
        
        let result;
        if (yours > bot) {
            economy.addWallet(sender, amount);
            result = `🎉 *YOU WIN!*\n${SYMBOL} +*${amount.toLocaleString()} ${CURRENCY}*`;
        } else if (yours < bot) {
            economy.removeWallet(sender, amount);
            result = `💀 *YOU LOSE!*\n${SYMBOL} -*${amount.toLocaleString()} ${CURRENCY}*`;
        } else {
            result = `🤝 *TIE!* No one wins or loses.`;
        }
        reply(`🎲 *DICE BATTLE*\n\n🧑 You rolled: *${yours}*\n🤖 Bot rolled: *${bot}*\n\n${result}\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`);
    }
};
