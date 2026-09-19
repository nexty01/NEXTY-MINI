module.exports = {
    name: 'qr',
    description: 'Generate a QR code URL for the given text.',
    category: 'general',
    async execute({ args, reply, sock, msg, from }) {
        const text = args.join(' ').trim();
        if (!text) return reply('Usage: .qr <text or url>');
        const url = 'https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=' + encodeURIComponent(text);
        try {
            await sock.sendMessage(from, { image: { url }, caption: '🔳 *QR*\n' + text }, { quoted: msg });
        } catch (e) {
            return reply('🔳 *QR Code*\n' + url);
        }
    }
};
