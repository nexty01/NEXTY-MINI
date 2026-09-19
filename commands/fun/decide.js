module.exports = {
    name: 'decide',
    aliases: ['choose', 'pick'],
    description: 'Help decide between options',
    category: 'fun',
    async execute({ reply, args }) {
        if (args.length < 2) return reply('❌ Give me at least 2 options separated by spaces!\n\nExample: `.decide coffee tea juice`');
        const choice = args[Math.floor(Math.random() * args.length)];
        reply(`🤔 *Decision Made!*\n\nI choose: *${choice}*`);
    }
};
