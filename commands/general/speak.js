module.exports = {
    name: 'speak',
    aliases: ['voice'],
    description: 'Convert text to voice (Google TTS).',
    category: 'general',
    async execute({ args, reply, sock, msg, from }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Usage: .speak <text>');
        try {
            const url = 'https://translate.google.com/translate_tts?ie=UTF-8&q=' + encodeURIComponent(text) + '&tl=en&client=tw-ob';
            const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
            const buf = Buffer.from(await r.arrayBuffer());
            await sock.sendMessage(from, { audio: buf, mimetype: 'audio/mpeg', ptt: false }, { quoted: msg });
        } catch (e) { return reply('❌ TTS failed: ' + e.message); }
    }
};
