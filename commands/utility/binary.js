/**
 * Binary Command — Convert text to/from binary
 * Usage: .binary encode <text> | .binary decode <binary>
 */
module.exports = {
    name: 'binary',
    aliases: ['bin'],
    description: 'Convert text to/from binary',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 2) return reply('💻 *Binary Converter*\n\nUsage:\n• .binary encode Hello\n• .binary decode 01001000 01100101');
        const mode = args[0].toLowerCase();
        const input = args.slice(1).join(' ');
        if (mode === 'encode') {
            const result = input.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' ');
            return reply(`💻 *Binary Encoded*\n\nText: ${input}\nBinary: \`${result}\``);
        } else if (mode === 'decode') {
            try {
                const result = input.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join('');
                return reply(`💻 *Binary Decoded*\n\nBinary: ${input}\nText: *${result}*`);
            } catch { return reply('❌ Invalid binary input.'); }
        }
        reply('❌ Mode must be `encode` or `decode`');
    }
};
