module.exports = {
    name: 'hexencode',
    description: 'Text transform: hexencode',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return Buffer.from(s, 'utf8').toString('hex'); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
