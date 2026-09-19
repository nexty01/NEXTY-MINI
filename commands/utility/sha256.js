module.exports = {
    name: 'sha256',
    description: 'Text transform: sha256',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return require('crypto').createHash('sha256').update(s).digest('hex'); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
