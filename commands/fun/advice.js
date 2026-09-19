module.exports = {
    name: 'advice',
    description: 'A random piece of advice.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'Drink water. Stretch. Touch grass.',
            'If in doubt, sleep on it.',
            'You can borrow confidence. Act, then feel.',
            'Reply later, regret never.',
            'Do the hardest thing first.',
        ];
        return reply('💡 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
