module.exports = {
    name: 'gcd',
    description: 'Greatest common divisor of two numbers.',
    category: 'utility',
    async execute({ args, reply }) {
        const a = Math.abs(parseInt(args[0])), b = Math.abs(parseInt(args[1]));
        if (isNaN(a) || isNaN(b)) return reply('Usage: .gcd <a> <b>');
        const g = (x, y) => y ? g(y, x % y) : x;
        return reply('🔗 gcd(' + a + ', ' + b + ') = *' + g(a, b) + '*');
    }
};
