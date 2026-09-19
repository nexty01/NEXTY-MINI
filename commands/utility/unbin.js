module.exports = {
    name: 'unbin',
    description: 'Text transform: unbin',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b,2))).join(''); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
