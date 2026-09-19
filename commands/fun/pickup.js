module.exports = {
    name: 'pickup',
    aliases: ['rizz'],
    description: 'Random pickup line.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'Are you a magician? Because whenever I look at you, everyone else disappears.',
            'Do you have a map? I keep getting lost in your eyes.',
            'If you were a vegetable, you would be a cute-cumber.',
            'Are you French? Because Eiffel for you.',
            'Is your name Google? Because you have everything I have been searching for.',
        ];
        return reply('💌 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
