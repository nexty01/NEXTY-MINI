module.exports = {
    name: 'sha1',
    description: 'Text transform: sha1',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return require('crypto').createHash('sha1').update(s).digest('hex'); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
