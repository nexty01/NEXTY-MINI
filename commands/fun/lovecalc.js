module.exports = {
    name: 'lovecalc',
    aliases: ['matchup'],
    description: 'Love compatibility calculator. Usage: .lovecalc Alice Bob',
    category: 'fun',
    async execute({ args, reply }) {
        if (args.length < 2) return reply('Usage: .lovecalc <name1> <name2>');
        const a = args[0], b = args.slice(1).join(' ');
        let h = 0; for (const c of (a+b).toLowerCase()) h = (h*31 + c.charCodeAt(0)) >>> 0;
        const pct = h % 101;
        const bars = '█'.repeat(Math.round(pct/10)).padEnd(10, '░');
        return reply('💞 *Love Calculator*\n' + a + ' 💖 ' + b + '\n[' + bars + '] *' + pct + '%*');
    }
};
