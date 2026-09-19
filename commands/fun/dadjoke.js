module.exports = {
    name: 'dadjoke',
    description: 'Classic dad joke.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'I am reading a book on anti-gravity. It is impossible to put down.',
            'Why don\'t scientists trust atoms? Because they make up everything.',
            'I told my wife she was drawing her eyebrows too high. She looked surprised.',
            'I would tell you a construction joke, but I am still working on it.',
            'Why did the scarecrow get a promotion? He was outstanding in his field.',
        ];
        return reply('👨 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
