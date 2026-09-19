module.exports = {
    name: 'mirror',
    description: 'Text transform: mirror',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.split('').reverse().join(''); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
