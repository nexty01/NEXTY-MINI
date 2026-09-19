module.exports = {
    name: 'wcount',
    description: 'Text transform: wcount',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return 'Words: ' + s.trim().split(/\s+/).length; })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
