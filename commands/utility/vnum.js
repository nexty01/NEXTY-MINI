/**
 * .vnum — List available countries for virtual numbers (sms24).
 * Usage: .vnum
 */
const {
    fetchVnum, friendlyError, extractList, normalizeCountry
} = require('../../lib/vnum');

module.exports = {
    name: 'vnum',
    aliases: ['vnumcountries', 'numbers'],
    description: 'List countries with available virtual numbers',
    category: 'utility',
    async execute({ reply }) {
        let json;
        try {
            json = await fetchVnum('sms24-countries');
        } catch (err) {
            return reply(friendlyError(err));
        }

        const rawList = extractList(json, ['data', 'countries', 'result', 'data.countries']);
        const countries = rawList.map(normalizeCountry).filter(c => c.code);

        if (!countries.length) {
            return reply('⚠️ No countries returned by sms24 right now. Try again later.');
        }

        const top = countries.slice(0, 60);
        const lines = top.map((c, i) =>
            `${String(i + 1).padStart(2, ' ')}. ${c.flag ? c.flag + ' ' : ''}${c.name} — \`${c.code}\``
        );

        const more = countries.length > top.length
            ? `\n…and ${countries.length - top.length} more.`
            : '';

        const text =
            `📞 *Virtual Number Countries* (${countries.length})\n\n` +
            lines.join('\n') + more +
            `\n\n👉 Next: *.vnumget <country-code>*  (e.g. \`.vnumget ${top[0].code}\`)`;

        return reply(text);
    }
};
