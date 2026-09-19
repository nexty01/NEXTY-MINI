module.exports = {
    name: 'lcm',
    description: 'Least common multiple of two numbers.',
    category: 'utility',
    async execute({ args, reply }) {
        const a = Math.abs(parseInt(args[0])), b = Math.abs(parseInt(args[1]));
        if (isNaN(a) || isNaN(b) || a === 0 || b === 0) return reply('Usage: .lcm <a> <b>');
        const g = (x, y) => y ? g(y, x % y) : x;
        return reply('🔗 lcm(' + a + ', ' + b + ') = *' + (a*b/g(a,b)) + '*');
    }
};
