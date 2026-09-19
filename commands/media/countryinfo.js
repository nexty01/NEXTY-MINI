/**
 * Country Info Command
 * Usage: .countryinfo <country-name>
 */

const axios = require('axios');

module.exports = {
    name: 'countryinfo',
    aliases: ['country'],
    description: 'Get information about a country',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const country = args.join(' ');
        if (!country) {
            return reply('🌍 Please provide a country name.\nExample: .countryinfo Nigeria');
        }

        try {
            const res = await axios.get(`https://restcountries.com/v3.1/name/${encodeURIComponent(country)}`);
            const data = res.data[0];

            const caption = `🌍 *Country Info: ${data.name.common}*\n\n` +
                `🏛️ *Capital:* ${data.capitals ? data.capitals.join(', ') : 'N/A'}\n` +
                `👥 *Population:* ${data.population.toLocaleString()}\n` +
                `🗺️ *Region:* ${data.region} (${data.subregion})\n` +
                `🗣️ *Languages:* ${Object.values(data.languages || {}).join(', ')}\n` +
                `💰 *Currencies:* ${Object.values(data.currencies || {}).map(c => `${c.name} (${c.symbol})`).join(', ')}\n` +
                `🕒 *Timezones:* ${data.timezones.join(', ')}`;

            await sock.sendMessage(from, {
                image: { url: data.flags.png },
                caption: caption
            }, { quoted: msg });
        } catch (err) {
            console.error('[countryinfo]', err.message);
            reply('❌ Country not found or API error.');
        }
    }
};
