module.exports = {
    name: 'pct',
    description: 'Percentage. Usage: .pct 50 of 200',
    category: 'utility',
    async execute({ args, reply }) {
        const m = args.join(' ').match(/^([\d.]+)\s*(?:%|of|\/)\s*([\d.]+)$/i);
        if (!m) return reply('Usage: .pct 25 of 200');
        const p = +m[1], total = +m[2];
        return reply('📊 ' + p + '% of ' + total + ' = *' + (p*total/100) + '*');
    }
};
