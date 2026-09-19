module.exports = {
    name: 'timestamp',
    aliases: ['unixtime', 'epoch'],
    description: 'Get current unix timestamp',
    category: 'utility',
    async execute({ reply }) {
        const ms = Date.now();
        return reply(`⌛ *Now*\n• Seconds : ${Math.floor(ms/1000)}\n• Millis  : ${ms}\n• ISO     : ${new Date().toISOString()}`);
    }
};
