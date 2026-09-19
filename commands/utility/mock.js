module.exports = {
    name: 'mock',
    description: 'Text transform: mock',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.split('').map((c,i) => i%2 ? c.toLowerCase() : c.toUpperCase()).join(''); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
