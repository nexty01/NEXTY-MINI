module.exports = {
    name: 'fibonacci',
    aliases: ['fib'],
    description: 'First N fibonacci numbers (max 50).',
    category: 'utility',
    async execute({ args, reply }) {
        const n = Math.min(parseInt(args[0]) || 10, 50);
        const a = [0, 1];
        while (a.length < n) a.push(a[a.length-1] + a[a.length-2]);
        return reply('🌀 *Fibonacci(' + n + ')*\n' + a.slice(0, n).join(', '));
    }
};
