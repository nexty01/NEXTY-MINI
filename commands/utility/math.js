module.exports = {
    name: 'math',
    aliases: ['eval', 'compute'],
    description: 'Evaluate a safe arithmetic expression. Example: .math 2+2*5',
    category: 'utility',
    async execute({ args, reply }) {
        const expr = args.join(' ').trim();
        if (!expr) return reply('Give me an expression. Example: .math (3+4)*2');
        if (!/^[-+*/().\d\s%]+$/.test(expr)) return reply('❌ Only numbers and + - * / ( ) % are allowed.');
        try {
            const v = Function('"use strict"; return (' + expr + ');')();
            return reply('🧮 ' + expr + ' = *' + v + '*');
        } catch (e) { return reply('❌ ' + e.message); }
    }
};
