/**
 * CoinFlip Command — Flip a coin
 * Usage: .coinflip [times]
 */
module.exports = {
    name: 'coinflip',
    aliases: ['flip', 'toss'],
    description: 'Flip a coin (or multiple)',
    category: 'utility',
    async execute({ reply, args }) {
        const times = Math.min(parseInt(args[0]) || 1, 10);
        const results = Array.from({ length: times }, () => Math.random() < 0.5 ? '🪙 Heads' : '🟡 Tails');
        const heads = results.filter(r => r.includes('Heads')).length;
        const tails = times - heads;
        if (times === 1) return reply(`🪙 *Coin Flip!*\n\nResult: *${results[0]}*`);
        reply(`🪙 *Coin Flip!* (${times} flips)\n\n${results.join('\n')}\n\n📊 Heads: ${heads} | Tails: ${tails}`);
    }
};
