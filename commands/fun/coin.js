module.exports = {
    name: 'coin',
    aliases: ['cointoss'],
    description: 'Flip a coin.',
    category: 'fun',
    async execute({ reply }) {
        return reply('🪙 ' + (Math.random() < 0.5 ? '*HEADS*' : '*TAILS*'));
    }
};
