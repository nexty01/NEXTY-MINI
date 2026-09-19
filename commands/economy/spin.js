const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'spin',
    aliases: ['wheel', 'spinwheel'],
    description: 'Spin the prize wheel for rewards',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'spin');
        if (cd.onCooldown) return reply(`🎡 Wheel resets in *${formatTime(cd.remaining)}*!`);
        const segments = [
            { emoji:'💥', label:'Bankrupt!', coins:0, type:'lose' },
            { emoji:'⭐', label:'50 coins', coins:50 },
            { emoji:'💰', label:'200 coins', coins:200 },
            { emoji:'🎁', label:'500 coins', coins:500 },
            { emoji:'💎', label:'1,000 coins!', coins:1000 },
            { emoji:'🔥', label:'100 coins', coins:100 },
            { emoji:'🌟', label:'2,500 coins!', coins:2500 },
            { emoji:'😢', label:'10 coins', coins:10 },
        ];
        const result = segments[Math.floor(Math.random()*segments.length)];
        economy.setCooldown(sender, 'spin', 14400000); // 4 hours
        if (result.coins > 0) economy.addWallet(sender, result.coins);
        const bal = economy.getBalance(sender);
        reply(
            `🎡 *Wheel Spin!*\n\n` +
            `${result.emoji} You landed on: *${result.label}*\n` +
            `${result.coins > 0 ? `${SYMBOL} +${result.coins.toLocaleString()} ${CURRENCY}` : '💸 No coins earned!'}\n\n` +
            `👛 Wallet: *${bal.wallet.toLocaleString()}*\n\n` +
            `_Spin again in 4 hours!_`
        );
    }
};
