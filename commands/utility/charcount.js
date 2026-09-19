module.exports = {
    name: 'charcount',
    description: 'Text transform: charcount',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return 'Chars (no spaces): ' + s.replace(/\s/g, '').length; })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
