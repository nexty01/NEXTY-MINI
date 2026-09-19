/**
 * .vnumget <country> — List virtual numbers for a country.
 */
const {
    fetchVnum, friendlyError, extractList, normalizeNumber
} = require('../../lib/vnum');

module.exports = {
    name: 'vnumget',
    aliases: ['vnumlist', 'getnumber'],
    description: 'Get virtual numbers for a country. Usage: .vnumget <country-code>',
    category: 'utility',
    async execute({ args, reply }) {
        const country = (args[0] || '').trim().toLowerCase();
        if (!country) {
            return reply('❓ Usage: *.vnumget <country-code>*\nRun *.vnum* to see codes (e.g. `.vnumget us`).');
        }
        if (!/^[a-z]{2,}$/i.test(country)) {
            return reply('⚠️ Country code should be letters only (e.g. `us`, `uk`, `ru`).');
        }

        let json;
        try {
            json = await fetchVnum('sms24-numbers', { country });
        } catch (err) {
            return reply(friendlyError(err));
        }

        const list = extractList(json, ['data', 'numbers', 'result', 'data.numbers'])
            .map(normalizeNumber)
            .filter(n => n.number);

        if (!list.length) {
            return reply(`⚠️ No numbers available for *${country.toUpperCase()}* right now. Try another country with *.vnum*.`);
        }

        const top = list.slice(0, 15);
        const lines = top.map((n, i) => {
            const tag = n.service ? `  _(${n.service})_` : '';
            const upd = n.updated ? `  · ${n.updated}` : '';
            return `${String(i + 1).padStart(2, ' ')}. \`${n.number}\`${tag}${upd}`;
        });

        const more = list.length > top.length ? `\n…and ${list.length - top.length} more.` : '';
        const sample = top[0].number;

        const text =
            `📲 *Virtual Numbers — ${country.toUpperCase()}* (${list.length})\n\n` +
            lines.join('\n') + more +
            `\n\n👉 Next: *.vnumotp <number>*  (e.g. \`.vnumotp ${sample}\`)`;

        return reply(text);
    }
};
