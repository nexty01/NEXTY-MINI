module.exports = {
    name: 'owofy',
    aliases: ['owo'],
    description: 'OwO-ify text. UwU.',
    category: 'fun',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Give me text to owo-fy.');
        const out = text
            .replace(/[rl]/g, 'w').replace(/[RL]/g, 'W')
            .replace(/n([aeiou])/gi, (m,c) => 'ny' + c)
            .replace(/!+/g, ' uwu!') + ' uwu';
        return reply(out);
    }
};
