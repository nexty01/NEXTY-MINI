module.exports = {
    name: 'ship',
    aliases: ['love', 'couple'],
    description: 'Ship two people together',
    category: 'fun',
    async execute({ reply, args }) {
        if (args.length < 2) return reply('❌ Usage: `.ship Name1 Name2`');
        const name1 = args[0];
        const name2 = args[1];
        const percent = Math.floor(Math.random() * 101);
        const bar = '❤️'.repeat(Math.floor(percent / 10)) + '🖤'.repeat(10 - Math.floor(percent / 10));
        let emoji = percent > 80 ? '💘 Perfect Match!' : percent > 50 ? '💕 Good Match!' : percent > 30 ? '💛 Maybe...' : '💔 Not a match';
        reply(`💞 *Ship Results*\n\n${name1} & ${name2}\n\n${bar}\n❤️ ${percent}% compatibility\n\n${emoji}`);
    }
};
