/**
 * QRCode Command — Generate QR code for text/URL
 * Usage: .qrcode <text>
 */

module.exports = {
    name: 'qrcode',
    aliases: ['qr', 'qrgen'],
    description: 'Generate QR code for text or URL',
    category: 'utility',
    async execute({ sock, msg, from, reply, args }) {
        if (!args.length) {
            return reply(
                `📱 *QR Code Generator*\n\n` +
                `Usage: .qrcode <text or url>\n` +
                `Example: .qrcode https://google.com`
            );
        }

        const text = args.join(' ');
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`;

        try {
            await sock.sendMessage(from, {
                image: { url: qrUrl },
                caption: `📱 *QR Code Generated*\n\nContent: ${text}`
            }, { quoted: msg });
        } catch (err) {
            reply('❌ Failed to generate QR code. Please try again.');
        }
    }
};
