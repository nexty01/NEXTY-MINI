module.exports = {
    name: 'beauty',
    aliases: ['howpretty'],
    description: 'Rate beauty 0-100%',
    category: 'fun',
    async execute({ msg, sender, reply }) {
        const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0] || sender || '').split('@')[0] || 'you';
        return reply('💄 @' + target + ' is *' + Math.floor(Math.random()*101) + '%* beautiful today.');
    }
};
