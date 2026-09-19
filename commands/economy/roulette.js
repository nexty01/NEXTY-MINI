const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
const RED = [1,3,5,7,9,12,14,16,18,19,21,23,25,27,30,32,34,36];
const BLACK = [2,4,6,8,10,11,13,15,17,20,22,24,26,28,29,31,33,35];
module.exports = {
    name: 'roulette',
    aliases: ['rl'],
    description: 'Play roulette — bet on red, black, or a number',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const amount = parseInt(args[0]);
        const choice = (args[1] || '').toLowerCase();
        if (!amount || amount <= 0 || !choice) return reply(`❌ Usage: \`.roulette <amount> <red/black/number>\`\n\nExamples:\n• \`.roulette 500 red\`\n• \`.roulette 1000 17\``);
        const bal = economy.getBalance(sender);
        if (amount > bal.wallet) return reply(`❌ Not enough ${CURRENCY}!`);
        
        const result = Math.floor(Math.random() * 37); // 0-36
        const isRed = RED.includes(result);
        const isBlack = BLACK.includes(result);
        const color = result === 0 ? '🟢 Green' : isRed ? '🔴 Red' : '⚫ Black';
        
        let won = false, multiplier = 0;
        if (choice === 'red' && isRed) { won = true; multiplier = 2; }
        else if (choice === 'black' && isBlack) { won = true; multiplier = 2; }
        else if (parseInt(choice) === result) { won = true; multiplier = 36; }
        
        if (won) {
            const winnings = amount * multiplier;
            economy.addWallet(sender, winnings - amount);
            reply(`🎡 *R O U L E T T E*\n\n🔮 The ball lands on... *${result}* (${color})\n\n🎉 *YOU WIN!* x${multiplier}\n${SYMBOL} +*${winnings.toLocaleString()} ${CURRENCY}*\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`);
        } else {
            economy.removeWallet(sender, amount);
            reply(`🎡 *R O U L E T T E*\n\n🔮 The ball lands on... *${result}* (${color})\n\n💀 *You lose!*\n${SYMBOL} -*${amount.toLocaleString()} ${CURRENCY}*\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`);
        }
    }
};
