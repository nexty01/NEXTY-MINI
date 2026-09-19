const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
const REELS = ['🍒', '🍋', '💎', '7️⃣', '🍀', '🔔', '⭐', '🍉'];
const PAYOUTS = { '💎💎💎': 10, '7️⃣7️⃣7️⃣': 7, '🍀🍀🍀': 5, '🔔🔔🔔': 4, '⭐⭐⭐': 3, '🍒🍒🍒': 3, '🍋🍋🍋': 2, '🍉🍉🍉': 2 };
module.exports = {
    name: 'slots',
    aliases: ['slot', 'slotmachine'],
    description: 'Play the slot machine',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const bal = economy.getBalance(sender);
        const amount = args[0] === 'all' ? bal.wallet : parseInt(args[0]);
        if (!amount || amount <= 0) return reply(`❌ Usage: \`.slots <amount>\`\n\nExample: \`.slots 500\``);
        if (amount > bal.wallet) return reply(`❌ You only have *${bal.wallet.toLocaleString()} ${CURRENCY}*!`);
        
        const r = [REELS[Math.floor(Math.random()*REELS.length)], REELS[Math.floor(Math.random()*REELS.length)], REELS[Math.floor(Math.random()*REELS.length)]];
        const combo = r.join('');
        const multiplier = PAYOUTS[combo] || 0;
        
        let result;
        if (multiplier > 0) {
            const winnings = amount * multiplier;
            economy.addWallet(sender, winnings - amount);
            result = `🎰 *S L O T S* 🎰\n\n╔═══════════╗\n║  ${r[0]} ║ ${r[1]} ║ ${r[2]}  ║\n╚═══════════╝\n\n🎉 *JACKPOT!* x${multiplier}!\nYou won *${winnings.toLocaleString()} ${CURRENCY}*! ${SYMBOL}`;
        } else if (r[0] === r[1] || r[1] === r[2]) {
            const partial = Math.floor(amount * 0.5);
            economy.removeWallet(sender, amount - partial);
            result = `🎰 *S L O T S* 🎰\n\n╔═══════════╗\n║  ${r[0]} ║ ${r[1]} ║ ${r[2]}  ║\n╚═══════════╝\n\n😐 *Close!* 2 matching!\nYou got back *${partial.toLocaleString()} ${CURRENCY}*`;
        } else {
            economy.removeWallet(sender, amount);
            result = `🎰 *S L O T S* 🎰\n\n╔═══════════╗\n║  ${r[0]} ║ ${r[1]} ║ ${r[2]}  ║\n╚═══════════╝\n\n💀 *No match!*\nYou lost *${amount.toLocaleString()} ${CURRENCY}*`;
        }
        reply(`${result}\n\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`);
    }
};
