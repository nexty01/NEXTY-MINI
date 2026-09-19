/**
 * IP Lookup Command
 * Usage: .iplookup <IP Address>
 */

const axios = require('axios');

module.exports = {
    name: 'iplookup',
    aliases: ['ipinfo', 'ip'],
    description: 'Get information about an IP address',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const ip = args[0];
        if (!ip) {
            return reply('🔍 Please provide an IP address.\nExample: .iplookup 8.8.8.8');
        }

        try {
            const res = await axios.get(`http://ip-api.com/json/${ip}`);
            const data = res.data;

            if (data.status === 'fail') {
                return reply(`❌ Error: ${data.message}`);
            }

            const caption = `🌐 *IP Lookup Info*\n\n` +
                `📍 *IP:* ${data.query}\n` +
                `🌍 *Country:* ${data.country} (${data.countryCode})\n` +
                `🏙️ *Region:* ${data.regionName}\n` +
                `🌆 *City:* ${data.city}\n` +
                `📮 *Zip:* ${data.zip}\n` +
                `🕒 *Timezone:* ${data.timezone}\n` +
                `🏢 *ISP:* ${data.isp}\n` +
                `🛰️ *Org:* ${data.org}\n` +
                `🗺️ *Lat/Lon:* ${data.lat}, ${data.lon}`;

            reply(caption);
        } catch (err) {
            console.error('[iplookup]', err.message);
            reply('❌ Failed to fetch IP info. Please try again later.');
        }
    }
};
