/**
 * Vowel Count Command — Count vowels and consonants in text.
 * Usage: .vowelcount <text>
 */
module.exports = {
    name: 'vowelcount',
    aliases: ['vowels'],
    description: 'Count vowels and consonants in text',
    category: 'utility',
    async execute({ reply, args }) {
        const text = args.join(' ').trim();
        if (!text) {
            return reply('🔤 *Vowel Counter*\n\nUsage: .vowelcount <text>\nExample: .vowelcount the quick brown fox');
        }
        const letters = text.replace(/[^a-z]/gi, '');
        const vowels = (text.match(/[aeiou]/gi) || []).length;
        const consonants = letters.length - vowels;

        reply(
            `🔤 *Vowel Counter*\n\n` +
            `Text: ${text}\n\n` +
            `• Vowels: ${vowels}\n` +
            `• Consonants: ${consonants}\n` +
            `• Letters: ${letters.length}\n` +
            `• Total chars: ${text.length}`
        );
    }
};
