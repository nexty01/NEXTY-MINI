module.exports = {
    name: 'flip',
    aliases: ['coinflip', 'coin'],
    description: 'Flip a coin',
    category: 'fun',
    async execute({ reply }) {
        const result = Math.random() < 0.5 ? 'HEADS 🪙' : 'TAILS 🔄';
        reply(`🪙 *Coin Flip!*\n\nResult: *${result}*`);
    }
};
