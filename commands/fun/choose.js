module.exports = {
    name: 'choose',
    aliases: ['pick'],
    description: 'Pick one option. Usage: .choose pizza, sushi, ramen',
    category: 'fun',
    async execute({ args, reply }) {
        const opts = args.join(' ').split(/[,|]/).map(s => s.trim()).filter(Boolean);
        if (opts.length < 2) return reply('Usage: .choose a, b, c');
        return reply('👉 *' + opts[Math.floor(Math.random()*opts.length)] + '*');
    }
};
