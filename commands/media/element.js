/**
 * Element Command
 * Usage: .element <symbol/name>
 */

const axios = require('axios');

module.exports = {
    name: 'element',
    description: 'Get information about a chemical element',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const query = args[0];
        if (!query) {
            return reply('🧪 Please provide an element symbol or name.\nExample: .element Gold');
        }

        try {
            const res = await axios.get(`https://neelpatel05.pythonanywhere.com/`);
            const elements = res.data;
            const data = elements.find(e => 
                e.name.toLowerCase() === query.toLowerCase() || 
                e.symbol.toLowerCase() === query.toLowerCase()
            );

            if (!data) {
                return reply(`❌ Could not find element "${query}".`);
            }

            const caption = `🧪 *Element Info: ${data.name} (${data.symbol})*\n\n` +
                `🔢 *Atomic Number:* ${data.atomicNumber}\n` +
                `⚖️ *Atomic Mass:* ${data.atomicMass}\n` +
                `🌡️ *Boiling Point:* ${data.boilingPoint} K\n` +
                `❄️ *Melting Point:* ${data.meltingPoint} K\n` +
                `💎 *Density:* ${data.density} g/cm³\n` +
                `🔋 *Electronegativity:* ${data.electronegativity}\n` +
                `📅 *Year Discovered:* ${data.yearDiscovered}\n` +
                `👨‍🔬 *Discoverer:* ${data.discoverer}`;

            reply(caption);
        } catch (err) {
            console.error('[element]', err.message);
            reply('❌ Failed to fetch element info.');
        }
    }
};
