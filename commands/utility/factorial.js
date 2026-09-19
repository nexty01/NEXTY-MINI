module.exports = {
    name: 'factorial',
    description: 'Compute n! (max n=170 for safe number range).',
    category: 'utility',
    async execute({ args, reply }) {
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 0 || n > 170) return reply('Usage: .factorial <0–170>');
        let r = 1; for (let i = 2; i <= n; i++) r *= i;
        return reply('🔢 ' + n + '! = *' + r + '*');
    }
};
