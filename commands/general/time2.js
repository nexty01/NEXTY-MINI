module.exports = {
    name: 'time2',
    aliases: ['timezone'],
    description: 'Show current time in any timezone. Usage: .time2 [IANA TZ]',
    category: 'general',
    async execute({ args, reply }) {
        const tz = args[0] || 'UTC';
        try {
            const s = new Date().toLocaleString('en-GB', { timeZone: tz, hour12: false });
            return reply('🕒 *' + tz + '*\n' + s);
        } catch (e) { return reply('❌ Unknown timezone. Example: .time2 Africa/Lagos'); }
    }
};
