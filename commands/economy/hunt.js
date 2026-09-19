const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'hunt',
    aliases: ['hunting', 'shoot'],
    description: 'Go hunting for PASQUA Bucks',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'hunt');
        if (cd.onCooldown) return reply(`🦌 Rest for *${formatTime(cd.remaining)}* before hunting again.`);
        const prey = [
            { emoji:'🐇', name:'Rabbit', min:80, max:200 },
            { emoji:'🦌', name:'Deer', min:200, max:500 },
            { emoji:'🐗', name:'Wild Boar', min:300, max:700 },
            { emoji:'🦁', name:'Lion!', min:600, max:1200 },
            { emoji:'🐍', name:'Snake', min:100, max:250 },
            { emoji:'🦊', name:'Fox', min:150, max:350 },
            { emoji:'💨', name:'Nothing — missed!', min:0, max:0 },
            { emoji:'🐘', name:'Elephant!', min:800, max:1500 },
        ];
        const animal = prey[Math.floor(Math.random()*prey.length)];
        const earned = animal.min === 0 ? 0 : Math.floor(Math.random()*(animal.max-animal.min))+animal.min;
        if (earned > 0) economy.addWallet(sender, earned);
        economy.setCooldown(sender, 'hunt', 3600000); // 1 hour
        const bal = economy.getBalance(sender);
        const resultMsg = earned > 0 ? `You hunted: ${animal.emoji} *${animal.name}*\n${SYMBOL} Earned: *${earned.toLocaleString()} ${CURRENCY}*` : `${animal.emoji} *${animal.name}* — better luck next time!`;
        reply(`🔫 *Hunting Results!*\n\n${resultMsg}\n\n👛 Wallet: *${bal.wallet.toLocaleString()}*\n\n_Come back in 1 hour!_`);
    }
};
