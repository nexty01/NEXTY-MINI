module.exports = {
    name: 'prime',
    description: 'Check if a number is prime.',
    category: 'utility',
    async execute({ args, reply }) {
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 0) return reply('Usage: .prime <number>');
        if (n < 2) return reply('❌ ' + n + ' is *not prime*.');
        for (let i = 2; i * i <= n; i++) if (n % i === 0) return reply('❌ ' + n + ' is *not prime* (divisible by ' + i + ').');
        return reply('✅ ' + n + ' is *prime*.');
    }
};
