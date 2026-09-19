/**
 * Caesar Cipher Command — Encode/decode with Caesar cipher
 * Usage: .caesar encode <shift> <text> | .caesar decode <shift> <text>
 */
function caesarShift(text, shift, decode) {
    const s = decode ? (26 - shift % 26) : shift;
    return text.replace(/[a-zA-Z]/g, c => {
        const base = c <= 'Z' ? 65 : 97;
        return String.fromCharCode(((c.charCodeAt(0) - base + s) % 26) + base);
    });
}
module.exports = {
    name: 'caesar',
    aliases: ['cipher'],
    description: 'Encode or decode text using Caesar cipher',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 3) return reply('🔐 *Caesar Cipher*\n\nUsage:\n• .caesar encode 3 Hello\n• .caesar decode 3 Khoor');
        const mode = args[0].toLowerCase();
        const shift = parseInt(args[1]);
        if (isNaN(shift)) return reply('❌ Shift must be a number.');
        const text = args.slice(2).join(' ');
        const result = caesarShift(text, shift, mode === 'decode');
        reply(`🔐 *Caesar Cipher*\n\nMode: ${mode}\nShift: ${shift}\nInput: ${text}\nResult: *${result}*`);
    }
};
