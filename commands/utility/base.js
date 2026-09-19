module.exports = {
    name: 'base',
    description: 'Convert number between bases. Usage: .base <num> <fromBase> <toBase>',
    category: 'utility',
    async execute({ args, reply }) {
        const [n, fb, tb] = args;
        const f = parseInt(fb), t = parseInt(tb);
        if (!n || isNaN(f) || isNaN(t) || f < 2 || f > 36 || t < 2 || t > 36)
            return reply('Usage: .base <num> <fromBase 2-36> <toBase 2-36>');
        const v = parseInt(n, f);
        if (isNaN(v)) return reply('❌ Invalid number for base ' + f);
        return reply('🔁 ' + n + ' (base ' + f + ') = *' + v.toString(t).toUpperCase() + '* (base ' + t + ')');
    }
};
