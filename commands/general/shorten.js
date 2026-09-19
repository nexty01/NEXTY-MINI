module.exports = {
    name: 'shorten',
    description: 'Shorten a URL using TinyURL.',
    category: 'general',
    async execute({ args, reply }) {
        const u = args[0];
        if (!u || !/^https?:\/\//.test(u)) return reply('Usage: .shorten https://...');
        try {
            const r = await fetch('https://tinyurl.com/api-create.php?url=' + encodeURIComponent(u));
            const t = await r.text();
            if (!/^https?:\/\//.test(t)) throw new Error(t);
            return reply('🔗 *Short link*\n' + t);
        } catch (e) { return reply('❌ ' + e.message); }
    }
};
