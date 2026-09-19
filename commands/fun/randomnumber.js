module.exports = {
    name: 'randomnumber',
    aliases: ['rng'],
    description: 'Random number. Usage: .randomnumber [min] [max]',
    category: 'fun',
    async execute({ args, reply }) {
        const min = parseInt(args[0]); const max = parseInt(args[1]);
        const lo = isNaN(min) ? 1 : min;
        const hi = isNaN(max) ? 100 : max;
        if (hi < lo) return reply('max must be ≥ min');
        return reply('🎲 *' + (Math.floor(Math.random() * (hi - lo + 1)) + lo) + '*');
    }
};
