module.exports = {
    name: 'define2',
    description: 'Quick offline definition for a small built-in glossary.',
    category: 'general',
    async execute({ args, reply }) {
        const word = (args[0]||'').toLowerCase();
        const D = {
            sukuna: 'The King of Curses from Jujutsu Kaisen.',
            curse: 'A negative-energy spirit born from human emotion.',
            domain: 'An expanded territory enforcing a sorcerer\'s will.',
            ramen: 'Japanese wheat noodles served in broth.',
            chakra: 'Spiritual or energetic body wheels in eastern tradition.',
            bot: 'A program that performs automated tasks.',
        };
        if (!word) return reply('Usage: .define2 <word>\nGlossary: ' + Object.keys(D).join(', '));
        return reply(D[word] ? '📖 *' + word + '*\n' + D[word] : '❌ Not in mini glossary. Try .define for full lookup.');
    }
};
