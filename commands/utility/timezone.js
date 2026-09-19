/**
 * Timezone Command — Get current time in different timezones
 * Usage: .timezone <zone>
 */
const zones = {
    'utc':'UTC','london':'Europe/London','paris':'Europe/Paris','dubai':'Asia/Dubai',
    'moscow':'Europe/Moscow','india':'Asia/Kolkata','lagos':'Africa/Lagos','nairobi':'Africa/Nairobi',
    'tokyo':'Asia/Tokyo','sydney':'Australia/Sydney','newyork':'America/New_York',
    'losangeles':'America/Los_Angeles','chicago':'America/Chicago','toronto':'America/Toronto',
    'singapore':'Asia/Singapore','beijing':'Asia/Shanghai','jakarta':'Asia/Jakarta',
    'cairo':'Africa/Cairo','accra':'Africa/Accra','johannesburg':'Africa/Johannesburg'
};
module.exports = {
    name: 'timezone',
    aliases: ['tz', 'worldtime'],
    description: 'Get current time in different timezones',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply(`🌍 *Timezone*\n\nUsage: .timezone <city>\n\nAvailable cities:\n${Object.keys(zones).join(', ')}`);
        }
        const key = args[0].toLowerCase().replace(/\s/g,'');
        const zone = zones[key];
        if (!zone) return reply(`❌ Unknown timezone. Try: ${Object.keys(zones).slice(0,8).join(', ')}...`);
        try {
            const now = new Date().toLocaleString('en-US', { timeZone: zone, weekday:'short', year:'numeric', month:'short', day:'numeric', hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:true });
            reply(`🕐 *World Time*\n\n🌍 City: ${args[0].charAt(0).toUpperCase()+args[0].slice(1)}\n📍 Zone: ${zone}\n🕐 Time: *${now}*`);
        } catch { reply('❌ Error fetching time for that timezone.'); }
    }
};
