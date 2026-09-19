module.exports = {
    name: 'title',
    description: 'Text transform: title',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.toLowerCase().replace(/(^|\s)\S/g, c => c.toUpperCase()); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
