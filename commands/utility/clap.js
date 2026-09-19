module.exports = {
    name: 'clap',
    description: 'Text transform: clap',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.trim().split(/\s+/).join(' 👏 '); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
