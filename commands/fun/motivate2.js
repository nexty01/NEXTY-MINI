module.exports = {
    name: 'motivate2',
    aliases: ['inspire'],
    description: 'Random motivational quote.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'You do not rise to the level of your goals — you fall to the level of your systems.',
            'Discipline is choosing between what you want now and what you want most.',
            'The cave you fear to enter holds the treasure you seek.',
            'Do something today your future self will thank you for.',
            'Energy and persistence conquer all things.',
        ];
        return reply('✨ ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
