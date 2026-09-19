module.exports = {
    name: 'chucknorris',
    aliases: ['chuck'],
    description: 'Random Chuck Norris fact.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'Chuck Norris counted to infinity. Twice.',
            'Chuck Norris does not sleep. He waits.',
            'Chuck Norris can divide by zero.',
            'When Chuck Norris does push-ups, he pushes the earth down.',
            'Chuck Norris can hear sign language.',
        ];
        return reply('🥋 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
