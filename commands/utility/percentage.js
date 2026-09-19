/**
 * Percentage Command — Calculate percentages
 * Usage: .percent <value> of <total> | .percent <a> to <b>
 */
module.exports = {
    name: 'percent',
    aliases: ['percentage', 'pct'],
    description: 'Calculate percentages',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 3) return reply(
            `📐 *Percentage Calculator*\n\n` +
            `Modes:\n` +
            `• .percent 25 of 200 → What is 25% of 200?\n` +
            `• .percent 50 out 200 → 50 is what % of 200?\n` +
            `• .percent 100 to 150 → % change from 100 to 150?`
        );
        const a = parseFloat(args[0]), mode = args[1].toLowerCase(), b = parseFloat(args[2]);
        if (isNaN(a) || isNaN(b)) return reply('❌ Please enter valid numbers.');
        if (mode === 'of') {
            const result = ((a / 100) * b).toFixed(2);
            return reply(`📐 *Percentage*\n\n${a}% of ${b} = *${result}*`);
        } else if (mode === 'out') {
            const result = ((a / b) * 100).toFixed(2);
            return reply(`📐 *Percentage*\n\n${a} out of ${b} = *${result}%*`);
        } else if (mode === 'to') {
            const result = (((b - a) / a) * 100).toFixed(2);
            const arrow = b > a ? '📈' : '📉';
            return reply(`📐 *Percentage Change*\n\nFrom ${a} to ${b}\n${arrow} Change: *${result}%*`);
        }
        reply('❌ Mode must be `of`, `out`, or `to`');
    }
};
