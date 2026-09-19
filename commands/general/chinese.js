module.exports = {
    name: 'chinese',
    aliases: ['chinesezodiac'],
    description: 'Chinese zodiac sign. Usage: .chinese YYYY',
    category: 'general',
    async execute({ args, reply }) {
        const y = parseInt(args[0]);
        if (isNaN(y) || y < 1900 || y > 2100) return reply('Usage: .chinese YYYY');
        const ANIM = ['Monkey','Rooster','Dog','Pig','Rat','Ox','Tiger','Rabbit','Dragon','Snake','Horse','Goat'];
        return reply('🐉 *Chinese Zodiac*\n' + y + ' → *' + ANIM[y % 12] + '*');
    }
};
