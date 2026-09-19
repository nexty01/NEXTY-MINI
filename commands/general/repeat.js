module.exports = {
    name: 'repeat',
    description: 'Repeat text N times separately. Usage: .repeat 5 hello',
    category: 'general',
    async execute({ args, sock, from, msg }) {
        const n = parseInt(args[0]);
        if (isNaN(n) || n < 1 || n > 100) {
            return sock.sendMessage(from, { text: 'Usage: .repeat <1-100> <text>' }, { quoted: msg });
        }
        const text = args.slice(1).join(' ');
        if (!text) {
            return sock.sendMessage(from, { text: 'Give me text to repeat.' }, { quoted: msg });
        }
        for (let i = 0; i < n; i++) {
            await sock.sendMessage(from, { text }, { quoted: msg });
        }
    }
};
