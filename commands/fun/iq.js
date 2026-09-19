module.exports = {
    name: 'iq',
    description: 'IQ test (totally accurate).',
    category: 'fun',
    async execute({ args, reply, msg, sender }) {
        const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender || '').split('@')[0] || 'You';
        const iq = Math.floor(Math.random()*200);
        return reply('🧠 *IQ scan*\n@' + target + ' has *' + iq + ' IQ*.');
    }
};
