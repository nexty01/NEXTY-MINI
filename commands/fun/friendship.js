module.exports = {
    name: 'friendship',
    description: 'Friendship % between two people. Usage: .friendship Alice Bob',
    category: 'fun',
    async execute({ args, reply }) {
        if (args.length < 2) return reply('Usage: .friendship <a> <b>');
        const a = args[0], b = args.slice(1).join(' ');
        let h = 0; for (const c of (a+b).toLowerCase()) h = (h*17 + c.charCodeAt(0)) >>> 0;
        return reply('🤝 ' + a + ' & ' + b + ' are *' + (h%101) + '%* good friends.');
    }
};
