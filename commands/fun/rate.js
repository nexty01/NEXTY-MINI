module.exports = {
    name: 'rate',
    description: 'Rate anything /10. Usage: .rate pizza',
    category: 'fun',
    async execute({ args, reply }) {
        const thing = args.join(' ').trim() || 'this';
        return reply('⭐ I rate *' + thing + '* a solid *' + (Math.floor(Math.random()*11)) + '/10*.');
    }
};
