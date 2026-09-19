module.exports = {
    name: 'yomama',
    description: 'Yo mama joke.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'Yo mama so tall she trips over the moon.',
            'Yo mama so old her birth certificate is in Roman numerals.',
            'Yo mama so kind she apologizes to chairs.',
            'Yo mama so smart she finished a Rubik\'s cube in one twist.',
            'Yo mama so cool she has frostbite for a personality.',
        ];
        return reply('🤡 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
