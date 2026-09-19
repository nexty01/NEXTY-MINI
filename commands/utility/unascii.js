module.exports = {
    name: 'unascii',
    description: 'Text transform: unascii',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.trim().split(/\s+/).map(n => String.fromCharCode(+n)).join(''); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
