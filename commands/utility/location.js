/**
 * Location Command
 * Usage: /location <Location Name>
 */

const axios = require('axios');

async function geocode(query) {
    try {
        const res = await axios.get(`https://nominatim.openstreetmap.org/search`, {
            params: { q: query, format: 'json', limit: 1 },
            headers: { 'User-Agent': 'SukunaMD-Bot/3.0' }
        });
        if (res.data && res.data.length > 0) {
            return {
                lat: parseFloat(res.data[0].lat),
                lon: parseFloat(res.data[0].lon),
                display_name: res.data[0].display_name
            };
        }
    } catch (e) {
        console.error('[geocode error]', e.message);
    }
    return null;
}

module.exports = {
    name: 'location',
    aliases: ['loc', 'whereis'],
    description: 'Get location information for a given place',
    category: 'utility',
    async execute({ sock, msg, from, reply, args }) {
        const query = args.join(' ').trim();
        if (!query) {
            return reply(
                `📍 *Location Command*\n\n` +
                `Usage: /location <Location Name>\n` +
                `Example: /location Lagos`
            );
        }

        await sock.sendMessage(from, { react: { text: '📍', key: msg.key } }).catch(() => {});

        const geo = await geocode(query);

        if (!geo) {
            return reply(`❌ Could not find location: ${query}`);
        }

        const caption = `📍 *Location:* ${geo.display_name}\n` +
                        `*Latitude:* ${geo.lat}\n` +
                        `*Longitude:* ${geo.lon}`;

        // Generate a static map image for the location
        const mapUrl = `https://static-maps.yandex.ru/1.x/?lang=en_US&ll=${geo.lon},${geo.lat}&z=12&l=map&pt=${geo.lon},${geo.lat},pm2rdm`;

        try {
            await sock.sendMessage(from, {
                image: { url: mapUrl },
                caption: caption
            }, { quoted: msg });
        } catch (err) {
            console.error('[location] image send error:', err.message);
            await reply(caption);
        }
    }
};
