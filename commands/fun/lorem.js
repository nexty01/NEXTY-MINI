module.exports = {
    name: 'lorem',
    description: 'Random lorem ipsum sentences. Usage: .lorem [count]',
    category: 'fun',
    async execute({ args, reply }) {
        const n = Math.min(Math.max(parseInt(args[0]) || 3, 1), 20);
        const SENTS = [
            'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            'Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
            'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris.',
            'Duis aute irure dolor in reprehenderit in voluptate velit esse.',
            'Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia.',
        ];
        let out = ''; for (let i = 0; i < n; i++) out += SENTS[i % SENTS.length] + ' ';
        return reply('📜 ' + out.trim());
    }
};
