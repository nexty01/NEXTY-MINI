const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'interest',
    aliases: ['bankinterest'],
    description: 'Collect 2% interest on your bank balance',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'interest');
        if (cd.onCooldown) return reply(`⏰ Interest isn't ready yet!\n\n⏳ Come back in *${formatTime(cd.remaining)}*`);
        const r = economy.collectInterest(sender);
        if (!r.success) return reply(`❌ ${r.reason}\n\nDeposit some ${CURRENCY} first with \`.deposit\`!`);
        economy.setCooldown(sender, 'interest');
        reply(`🏦 *INTEREST COLLECTED!*\n\n📈 +*${r.interest.toLocaleString()} ${CURRENCY}* (2%)\n🏦 Bank Balance: *${r.bank.toLocaleString()}*\n\n_Collect again in 12 hours!_ ⏰`);
    }
};
