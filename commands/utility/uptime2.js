module.exports = {
    name: 'uptime2',
    description: 'Bot process uptime.',
    category: 'utility',
    async execute({ reply }) {
        const s = Math.floor(process.uptime());
        const h = Math.floor(s/3600), m = Math.floor(s%3600/60), sec = s%60;
        return reply('⏱️ *Uptime:* ' + h + 'h ' + m + 'm ' + sec + 's');
    }
};
