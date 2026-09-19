const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'fish',
    aliases: ['fishing', 'cast'],
    description: 'Go fishing for PASQUA Bucks',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'fish');
        if (cd.onCooldown) return reply(`🎣 Wait *${formatTime(cd.remaining)}* before fishing again.`);
        const catches = [
            { emoji:'🐟', name:'Small Fish', min:50, max:150 },
            { emoji:'🐠', name:'Tropical Fish', min:100, max:300 },
            { emoji:'🐡', name:'Pufferfish', min:80, max:250 },
            { emoji:'🦈', name:'Shark!', min:500, max:1000 },
            { emoji:'🦞', name:'Lobster', min:300, max:600 },
            { emoji:'🐙', name:'Octopus', min:200, max:450 },
            { emoji:'👢', name:'Old Boot', min:0, max:10 },
            { emoji:'💎', name:'Underwater Treasure!', min:800, max:1500 },
        ];
        const catch_ = catches[Math.floor(Math.random()*catches.length)];
        const earned = Math.floor(Math.random()*(catch_.max-catch_.min))+catch_.min;
        economy.addWallet(sender, earned);
        economy.setCooldown(sender, 'fish', 1800000); // 30 min
        const bal = economy.getBalance(sender);
        reply(`🎣 *Fishing Results!*\n\nYou caught: ${catch_.emoji} *${catch_.name}*\n${SYMBOL} Earned: *${earned.toLocaleString()} ${CURRENCY}*\n\n👛 Wallet: *${bal.wallet.toLocaleString()}*\n\n_Fish again in 30 minutes!_`);
    }
};
