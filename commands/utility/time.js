/**
 * Time Command — Display current time and world clocks
 * Usage: .time [timezone]
 */

module.exports = {
    name: 'time',
    aliases: ['clock', 'date', 'now'],
    description: 'Display current time, date, and world clocks',
    category: 'utility',
    async execute({ reply, args }) {
        const now = new Date();

        if (args.length) {
            // Show time for a specific timezone
            const tz = args.join('/').replace(/ /g, '_');
            try {
                const formatted = now.toLocaleString('en-US', { timeZone: tz, dateStyle: 'full', timeStyle: 'long' });
                return reply(
                    `🕐 *Time in ${tz}*\n\n` +
                    `📅 ${formatted}`
                );
            } catch {
                return reply(
                    `❌ Unknown timezone: "${args.join(' ')}"\n\n` +
                    `Try formats like:\n` +
                    `• .time America/New_York\n` +
                    `• .time Europe/London\n` +
                    `• .time Asia/Tokyo`
                );
            }
        }

        const zones = [
            { emoji: '🇺🇸', name: 'New York', tz: 'America/New_York' },
            { emoji: '🇬🇧', name: 'London', tz: 'Europe/London' },
            { emoji: '🇳🇬', name: 'Lagos', tz: 'Africa/Lagos' },
            { emoji: '🇮🇳', name: 'Mumbai', tz: 'Asia/Kolkata' },
            { emoji: '🇯🇵', name: 'Tokyo', tz: 'Asia/Tokyo' },
            { emoji: '🇦🇺', name: 'Sydney', tz: 'Australia/Sydney' },
        ];

        const fmtTime = (tz) => now.toLocaleString('en-US', { timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
        const fmtDate = (tz) => now.toLocaleString('en-US', { timeZone: tz, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

        const utcStr = now.toLocaleString('en-US', { timeZone: 'UTC', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
        const localDate = fmtDate('UTC');

        let worldClocks = zones.map(z => `${z.emoji} *${z.name}*: ${fmtTime(z.tz)}`).join('\n');

        const dayOfYear = Math.floor((now - new Date(now.getFullYear(), 0, 0)) / 86400000);
        const weekNum = Math.ceil(dayOfYear / 7);

        reply(
            `🕐 *TIME & DATE*\n\n` +
            `┌─────────────────────────┐\n` +
            `│  📅 *${localDate}*\n` +
            `│  🕛 UTC: *${utcStr}*\n` +
            `│  📆 Week ${weekNum} • Day ${dayOfYear}/365\n` +
            `└─────────────────────────┘\n\n` +
            `🌍 *World Clocks*\n\n` +
            `${worldClocks}\n\n` +
            `_Use .time <timezone> for a specific zone_\n` +
            `_Example: .time Asia/Tokyo_`
        );
    }
};
