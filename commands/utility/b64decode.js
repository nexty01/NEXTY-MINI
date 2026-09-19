module.exports = {
    name: 'b64decode',
    description: 'Text transform: b64decode',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return Buffer.from(s, 'base64').toString('utf8'); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
