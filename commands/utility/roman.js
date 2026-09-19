/**
 * Roman Numerals Command — Convert to/from Roman numerals
 * Usage: .roman <number> | .roman <roman>
 */
function toRoman(num) {
    const vals = [1000,900,500,400,100,90,50,40,10,9,5,4,1];
    const syms = ['M','CM','D','CD','C','XC','L','XL','X','IX','V','IV','I'];
    let result = '';
    vals.forEach((v,i) => { while (num >= v) { result += syms[i]; num -= v; } });
    return result;
}
function fromRoman(str) {
    const map = {I:1,V:5,X:10,L:50,C:100,D:500,M:1000};
    let result = 0;
    for (let i = 0; i < str.length; i++) {
        const cur = map[str[i]], next = map[str[i+1]];
        result += (next > cur) ? -cur : cur;
    }
    return result;
}
module.exports = {
    name: 'roman',
    aliases: ['romannum'],
    description: 'Convert to/from Roman numerals',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) return reply('🏛️ *Roman Numerals*\n\nUsage:\n• .roman 2024 → converts number to Roman\n• .roman MMXXIV → converts Roman to number');
        const input = args[0].toUpperCase();
        if (/^[IVXLCDM]+$/.test(input)) {
            const num = fromRoman(input);
            return reply(`🏛️ *Roman Numerals*\n\nRoman: ${input}\nNumber: *${num}*`);
        }
        const num = parseInt(input);
        if (isNaN(num) || num < 1 || num > 3999) return reply('❌ Enter a number between 1 and 3999, or a valid Roman numeral.');
        reply(`🏛️ *Roman Numerals*\n\nNumber: ${num}\nRoman: *${toRoman(num)}*`);
    }
};
