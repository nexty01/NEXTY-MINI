/**
 * Base64 Command — Encode/decode base64
 * Usage: .base64 encode <text> | .base64 decode <text>
 */

module.exports = {
    name: 'base64',
    aliases: ['b64', 'encode64'],
    description: 'Encode or decode base64 strings',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 2) {
            return reply(
                `🔐 *Base64 Encoder/Decoder*\n\n` +
                `Usage:\n` +
                `• .base64 encode <text>\n` +
                `• .base64 decode <base64_string>\n\n` +
                `Examples:\n` +
                `• .base64 encode Hello World\n` +
                `• .base64 decode SGVsbG8gV29ybGQ=`
            );
        }

        const action = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        try {
            if (action === 'encode') {
                const encoded = Buffer.from(text).toString('base64');
                reply(
                    `🔐 *Base64 Encode*\n\n` +
                    `Original: ${text}\n\n` +
                    `Encoded: ${encoded}`
                );
            } else if (action === 'decode') {
                const decoded = Buffer.from(text, 'base64').toString('utf8');
                reply(
                    `🔐 *Base64 Decode*\n\n` +
                    `Encoded: ${text}\n\n` +
                    `Decoded: ${decoded}`
                );
            } else {
                reply('❌ Invalid action. Use "encode" or "decode".');
            }
        } catch (err) {
            reply('❌ Operation failed. Please check your input.');
        }
    }
};
