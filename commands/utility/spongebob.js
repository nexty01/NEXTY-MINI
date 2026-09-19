module.exports = {
    name: 'spongebob',
    aliases: ['mocking'],
    description: 'sPoNgEbOb mocking text.',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Give me text to mock.');
        return reply(text.split('').map((c, i) => i % 2 ? c.toLowerCase() : c.toUpperCase()).join(''));
    }
};
