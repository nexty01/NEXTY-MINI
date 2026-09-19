module.exports = {
    name: 'dice',
    aliases: ['roll', 'rolldice'],
    description: 'Roll a dice',
    category: 'fun',
    async execute({ reply, args }) {
        const sides = parseInt(args[0]) || 6;
        const result = Math.floor(Math.random() * sides) + 1;
        reply(`🎲 Rolling a ${sides}-sided dice...\n\nYou rolled: *${result}*!`);
    }
};
