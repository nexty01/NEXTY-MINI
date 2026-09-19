const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'withdraw',
    aliases: ['with'],
    description: 'Withdraw PASQUA Bucks from your bank',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const bal = economy.getBalance(sender);
        const amount = args[0] === 'all' ? bal.bank : parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`❌ Usage: \`.withdraw <amount>\` or \`.withdraw all\``);
        const r = economy.withdraw(sender, amount);
        if (!r.success) return reply(`❌ ${r.reason}`);
        reply(`🏦 *WITHDRAWN!*\n\n${SYMBOL} *${amount.toLocaleString()}* ${CURRENCY} → Wallet\n\n👛 Wallet: *${r.wallet.toLocaleString()}*\n🏦 Bank: *${r.bank.toLocaleString()}*`);
    }
};
