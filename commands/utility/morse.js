/**
 * Morse Code Command — Encode/decode Morse code
 * Usage: .morse encode <text> | .morse decode <code>
 */
const MORSE = {A:'.-',B:'-...',C:'-.-.',D:'-..',E:'.',F:'..-.',G:'--.',H:'....',I:'..',J:'.---',K:'-.-',L:'.-..',M:'--',N:'-.',O:'---',P:'.--.',Q:'--.-',R:'.-.',S:'...',T:'-',U:'..-',V:'...-',W:'.--',X:'-..-',Y:'-.--',Z:'--..',0:'-----',1:'.----',2:'..---',3:'...--',4:'....-',5:'.....',6:'-....',7:'--...',8:'---..',9:'----.'};
const RMORSE = Object.fromEntries(Object.entries(MORSE).map(([k,v])=>[v,k]));
module.exports = {
    name: 'morse',
    aliases: ['morsecode'],
    description: 'Encode or decode Morse code',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 2) return reply('📡 *Morse Code*\n\nUsage:\n• .morse encode Hello\n• .morse decode .... . .-.. .-.. ---');
        const mode = args[0].toLowerCase();
        const input = args.slice(1).join(' ');
        if (mode === 'encode') {
            const result = input.toUpperCase().split('').map(c => c === ' ' ? '/' : (MORSE[c] || '?')).join(' ');
            return reply(`📡 *Morse Encoded*\n\nInput: ${input}\nMorse: \`${result}\``);
        } else if (mode === 'decode') {
            const result = input.split(' / ').map(word => word.split(' ').map(c => RMORSE[c] || '?').join('')).join(' ');
            return reply(`📡 *Morse Decoded*\n\nMorse: ${input}\nText: *${result}*`);
        }
        reply('❌ Mode must be `encode` or `decode`');
    }
};
