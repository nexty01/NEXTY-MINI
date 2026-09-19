/**
 * Aza — Owner's payment / bank account details card.
 *
 * The owner sets their bank details once, and anyone (or just the owner,
 * your call) can pull it up instantly with `.aza` — handy for business
 * / selling situations where you keep getting asked "what's your account".
 *
 * IMPORTANT: this command sends its card via sock.sendMessage() directly,
 * NOT the shared reply() helper — reply() always runs text through
 * fontSystem.convert() first, which remaps digits into stylized unicode
 * lookalikes for some fonts (Bold, Fullwidth, Circled, etc). That would
 * make the account number look "styled" but break clean copy/paste and
 * confuse payment apps. .aza always stays plain ASCII, no matter what
 * font the owner has set with .setfont.
 *
 * Usage:
 *   .aza                                                  — show the saved card
 *   .aza set <bank> | <account number> | <account name> | <phone> | [note]
 *   .aza clear                                            — wipe saved details
 *
 * Owner only for set/clear. Showing the card is open to everyone by default
 * (great for a business bot) — set SHOW_TO_ALL to false below to lock it
 * to the owner only.
 */
'use strict';

const SHOW_TO_ALL = true;

module.exports = {
    name: 'aza',
    aliases: ['bankdetails', 'accountdetails', 'paydetails'],
    description: "Set / show the owner's bank & payment details",
    category: 'owner',

    async execute({ sock, from, msg, args, phoneNumber, database, isOwner, reply }) {
        const sub = (args[0] || '').toLowerCase();

        // ── Clear saved details ─────────────────────────────────────────
        if (sub === 'clear' || sub === 'reset') {
            if (!isOwner) return reply('🔒 Only the bot owner can use this command.');
            database.setAzaDetails(phoneNumber, null);
            return reply('🗑️ Bank details cleared.');
        }

        // ── Set / update details ────────────────────────────────────────
        if (sub === 'set') {
            if (!isOwner) return reply('🔒 Only the bot owner can use this command.');

            const raw = args.slice(1).join(' ');
            const parts = raw.split('|').map(p => p.trim()).filter(Boolean);

            if (parts.length < 4) {
                return reply(
                    '❌ *Usage:*\n' +
                    '.aza set <bank> | <account number> | <account name> | <phone> | [note]\n\n' +
                    '*Example:*\n' +
                    '.aza set OPAY | 8161704028 | morejikeji | 08087070565 | send'
                );
            }

            const [bank, account, name, phone, note] = parts;

            const details = {
                bank,
                account,
                name,
                phone,
                note: note || 'send',
                setBy: phoneNumber,
                setAt: Date.now(),
            };

            database.setAzaDetails(phoneNumber, details);
            await sock.sendMessage(from, { text: '✅ Bank details saved.\n\n' + buildCard(details) }, { quoted: msg });
            return;
        }

        // ── Default: show the saved card ────────────────────────────────
        if (!SHOW_TO_ALL && !isOwner) {
            return reply('🔒 Only the bot owner can use this command.');
        }

        const details = database.getAzaDetails(phoneNumber);
        if (!details) {
            return reply(
                isOwner
                    ? '❌ No bank details set yet.\nUse: *.aza set <bank> | <account number> | <account name> | <phone> | [note]*'
                    : '❌ The owner has not set any bank details yet.'
            );
        }

        await sock.sendMessage(from, { text: buildCard(details) }, { quoted: msg });
    },
};

function buildCard(d) {
    return (
        `╭─❍ *AZA / BANK DETAILS*\n` +
        `│ 🏦 Bank: *${d.bank}*\n` +
        `│ 💳 Account: \`${d.account}\`\n` +
        `│ 👤 Name: *${d.name}*\n` +
        `│ ☏ Phone: \`${d.phone}\`\n` +
        `│ ✦ Note: _${d.note}_\n` +
        `│ ⚉ Last set by: ${d.setBy}\n` +
        `╰─ 𓄄 Copy & send easily‎`
    );
}
