/**
 * .vnumotp <number> — Fetch SMS messages / OTP codes for a virtual number.
 */
const {
    fetchVnum, friendlyError, extractList, normalizeMessage, extractOtp
} = require('../../lib/vnum');

module.exports = {
    name: 'vnumotp',
    aliases: ['otp', 'vnummsg', 'getotp', 'sms'],
    description: 'Read SMS / OTP for a virtual number. Usage: .vnumotp <number>',
    category: 'utility',
    async execute({ args, reply }) {
        const raw = args.join(' ').trim();
        if (!raw) {
            return reply('❓ Usage: *.vnumotp <number>*\nRun *.vnumget <country>* to find numbers first.');
        }
        // strip +, spaces, dashes, parens
        const number = raw.replace(/[^\d]/g, '');
        if (number.length < 6) {
            return reply('⚠️ That doesn\'t look like a phone number. Try a full number from *.vnumget*.');
        }

        let json;
        try {
            json = await fetchVnum('sms24-messages', { number });
        } catch (err) {
            return reply(friendlyError(err));
        }

        const list = extractList(json, ['data', 'messages', 'result', 'data.messages'])
            .map(normalizeMessage);

        if (!list.length) {
            return reply(
                `📭 No messages yet for \`${number}\`.\n` +
                `Trigger the OTP on the target site, then run *.vnumotp ${number}* again in ~30s.`
            );
        }

        const top = list.slice(0, 10);
        const blocks = top.map((m, i) => {
            const otp = m.otp || extractOtp(m.text);
            const header = `*${i + 1}.* ${m.from ? `*${m.from}*` : '_unknown sender_'}${m.time ? `  · ${m.time}` : ''}`;
            const otpLine = otp ? `\n🔑 *OTP: ${otp}*` : '';
            const body = m.text ? `\n${m.text}` : '';
            return header + otpLine + body;
        });

        const text =
            `📨 *Messages for \`${number}\`* (${top.length}${list.length > top.length ? '/' + list.length : ''})\n\n` +
            blocks.join('\n\n') +
            `\n\n_Tip: re-run *.vnumotp ${number}* to refresh._`;

        return reply(text);
    }
};
