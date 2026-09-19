const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'deposit',
    aliases: ['dep'],
    description: 'Deposit PASQUA Bucks to your bank',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const bal = economy.getBalance(sender);
        const amount = args[0] === 'all' ? bal.wallet : parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`❌ Usage: \`.deposit <amount>\` or \`.deposit all\``);
        const r = economy.deposit(sender, amount);
        if (!r.success) return reply(`❌ ${r.reason}`);
        reply(`🏦 *DEPOSITED!*\n\n${SYMBOL} *${amount.toLocaleString()}* ${CURRENCY} → Bank\n\n👛 Wallet: *${r.wallet.toLocaleString()}*\n🏦 Bank: *${r.bank.toLocaleString()}*`);
    }
};
