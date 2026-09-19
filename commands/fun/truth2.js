module.exports = {
    name: 'truth2',
    description: 'Random truth question.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'What is the most embarrassing thing in your search history?',
            'Who in this chat would you trust with your phone unlocked?',
            'What is one secret you have never told anyone here?',
            'Have you ever lied to get out of plans? When?',
            'What is your biggest red flag?',
        ];
        return reply('🟢 *Truth*\n' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
