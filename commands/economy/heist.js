const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
const HEIST_STORIES = [
    { location: '🏦 Central Bank', stages: ['You sneak past the guards...', 'You crack the vault code...', 'You grab the cash and run!'] },
    { location: '💎 Diamond Exchange', stages: ['You disguise as a janitor...', 'You disable the laser grid...', 'You pocket the diamonds!'] },
    { location: '🏛️ The Museum', stages: ['You hack the security system...', 'You dodge the cameras...', 'You steal the golden artifact!'] },
    { location: '🎰 The Casino Vault', stages: ['You bribe the dealer...', 'You sneak into the back room...', 'You empty the safe!'] },
    { location: '🚂 The Money Train', stages: ['You board at midnight...', 'You fight off guards...', 'You crack the cargo!'] },
];
module.exports = {
    name: 'heist',
    aliases: ['robbery'],
    description: 'Attempt a solo heist for big rewards',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const cd = economy.checkCooldown(sender, 'heist');
        if (cd.onCooldown) return reply(`⏰ You need to lay low for *${formatTime(cd.remaining)}* before your next heist!`);
        
        const amount = parseInt(args[0]);
        if (!amount || amount < 500) return reply(`❌ Usage: \`.heist <amount>\` (minimum 500)\n\nThe higher you bet, the bigger the reward!`);
        const bal = economy.getBalance(sender);
        if (amount > bal.wallet) return reply(`❌ You need *${amount.toLocaleString()} ${CURRENCY}* to fund this heist!`);
        
        const story = HEIST_STORIES[Math.floor(Math.random() * HEIST_STORIES.length)];
        const successRate = Math.max(0.2, 0.6 - (amount / 50000));
        
        economy.setCooldown(sender, 'heist');
        
        let narrative = `🎬 *HEIST: ${story.location}*\n\n`;
        story.stages.forEach((s, i) => { narrative += `${i + 1}. ${s}\n`; });
        
        if (Math.random() < successRate) {
            const multiplier = 1.5 + Math.random() * 2;
            const winnings = Math.floor(amount * multiplier);
            economy.addWallet(sender, winnings - amount);
            narrative += `\n✅ *HEIST SUCCESSFUL!*\n\n💰 Payout: *${winnings.toLocaleString()} ${CURRENCY}*\n📈 Profit: *${(winnings - amount).toLocaleString()} ${CURRENCY}*\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`;
        } else {
            economy.removeWallet(sender, amount);
            narrative += `\n❌ *HEIST FAILED!*\n\n🚨 Alarms triggered! You lost your *${amount.toLocaleString()} ${CURRENCY}* investment!\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`;
        }
        reply(narrative);
    }
};
