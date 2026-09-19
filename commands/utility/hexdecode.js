module.exports = {
    name: 'hexdecode',
    description: 'Text transform: hexdecode',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return Buffer.from(s, 'hex').toString('utf8'); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
