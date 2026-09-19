module.exports = {
    name: 'urlencode',
    description: 'Text transform: urlencode',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return encodeURIComponent(s); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
