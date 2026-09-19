const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'mine',
    aliases: ['mining', 'dig'],
    description: 'Go mining for PASQUA Bucks',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'mine');
        if (cd.onCooldown) return reply(`⛏️ You're exhausted! Rest for *${formatTime(cd.remaining)}* before mining again.`);
        const outcomes = [
            { msg: 'struck a rich vein of gold', min: 300, max: 800 },
            { msg: 'found some copper ore', min: 100, max: 300 },
            { msg: 'discovered rare gems', min: 600, max: 1200 },
            { msg: 'dug up some coal', min: 50, max: 150 },
            { msg: 'hit an iron deposit', min: 200, max: 500 },
        ];
        const outcome = outcomes[Math.floor(Math.random()*outcomes.length)];
        const earned = Math.floor(Math.random()*(outcome.max-outcome.min))+outcome.min;
        economy.addWallet(sender, earned);
        economy.setCooldown(sender, 'mine', 3600000); // 1 hour
        const bal = economy.getBalance(sender);
        reply(`⛏️ *Mining Results!*\n\nYou ${outcome.msg}!\n${SYMBOL} Earned: *${earned.toLocaleString()} ${CURRENCY}*\n\n👛 Wallet: *${bal.wallet.toLocaleString()}*\n\n_Come back in 1 hour to mine again!_`);
    }
};
