module.exports = {
    name: 'bin',
    description: 'Text transform: bin',
    category: 'utility',
    async execute({ args, reply }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Send some text.');
        try {
            const out = (() => { const s = text; return s.split('').map(c => c.charCodeAt(0).toString(2).padStart(8,'0')).join(' '); })();
            return reply(String(out));
        } catch (e) {
            return reply('❌ ' + e.message);
        }
    }
};
