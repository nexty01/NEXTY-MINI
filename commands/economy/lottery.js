const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
const TICKET_PRICE = 100;
const JACKPOT = 10000;
module.exports = {
    name: 'lottery',
    aliases: ['lotto', 'ticket'],
    description: 'Buy a lottery ticket and try your luck',
    category: 'economy',
    async execute({ reply, sender }) {
        const cd = economy.checkCooldown(sender, 'lottery');
        if (cd.onCooldown) return reply(`🎰 Wait *${formatTime(cd.remaining)}* for next lottery draw.`);
        const bal = economy.getBalance(sender);
        if (bal.wallet < TICKET_PRICE) return reply(`❌ You need *${TICKET_PRICE} ${CURRENCY}* to buy a ticket!\n\nYour wallet: *${bal.wallet}*`);
        economy.removeWallet(sender, TICKET_PRICE);
        economy.setCooldown(sender, 'lottery', 7200000); // 2 hours
        const userNums = Array.from({length:6}, () => Math.floor(Math.random()*49)+1).sort((a,b)=>a-b);
        const winNums  = Array.from({length:6}, () => Math.floor(Math.random()*49)+1).sort((a,b)=>a-b);
        const matches = userNums.filter(n => winNums.includes(n)).length;
        let prize = 0, result;
        if (matches === 6) { prize = JACKPOT; result = '🏆 JACKPOT! 6/6 match!'; }
        else if (matches === 5) { prize = 2000; result = `🥇 Amazing! 5/6 match!`; }
        else if (matches === 4) { prize = 500; result = `🥈 Great! 4/6 match!`; }
        else if (matches === 3) { prize = 150; result = `🥉 Nice! 3/6 match!`; }
        else { result = `😔 Only ${matches}/6 — better luck next time!`; }
        if (prize > 0) economy.addWallet(sender, prize);
        const newBal = economy.getBalance(sender);
        reply(`🎟️ *Lottery Results*\n\nYour numbers: ${userNums.join(' - ')}\nWinning: ${winNums.join(' - ')}\n\n${result}\n${prize > 0 ? `${SYMBOL} Won: *${prize.toLocaleString()} ${CURRENCY}*!` : ''}\n\n👛 Wallet: *${newBal.wallet.toLocaleString()}*`);
    }
};
