/**
 * Profile — Sukuna-themed canvas profile card with text fallback.
 * Mirrors the .bal flow: prefer Lovable Cloud data, fall back to local JSON,
 * try the canvas render, fall back to plain text on any error.
 */
const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');

let cloud = null;
try { cloud = require('../../utils/cloudEconomy'); } catch (_) {}

let renderProfileCard = null;
try { ({ renderProfileCard } = require('../../utils/canvasRender')); } catch (_) {}

let healthMgr = null;
try { ({ health: healthMgr } = require('../../utils/healthManager')); } catch (_) {}

function rankFor(total) {
    if (total >= 100000) return { name: '💎 Diamond', color: '#60a5fa' };
    if (total >=  50000) return { name: '🥇 Gold',    color: '#fbbf24' };
    if (total >=  20000) return { name: '🥈 Silver',  color: '#d1d5db' };
    if (total >=   5000) return { name: '🔵 Bronze',  color: '#f97316' };
    return { name: '🥉 Beginner', color: '#9ca3af' };
}

module.exports = {
    name: 'profile',
    aliases: ['myprofile', 'card'],
    description: 'View your economy profile card',
    category: 'economy',

    async execute({ sock, msg, from, sender, reply }) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = mentioned?.[0] || sender;

        let name = target.split('@')[0].split(':')[0];
        const number = name;
        let wallet = 0, bank = 0, totalEarned = 0, location = 'tokyo';
        let petCount = 0, charCount = 0;

        try {
            if (cloud) {
                const wa  = cloud.waNumber(target);
                const uid = await cloud.getUserIdByWa(wa);
                if (uid) {
                    const [w, ps, prof, pets, chars] = await Promise.all([
                        cloud.getWallet(uid),
                        cloud.getPlayerState(uid),
                        cloud.rest
                            ? cloud.rest(`profiles?id=eq.${uid}&select=display_name`, {}).catch(() => null)
                            : Promise.resolve(null),
                        cloud.getPets ? cloud.getPets(uid).catch(() => []) : Promise.resolve([]),
                        cloud.getCharacters ? cloud.getCharacters(uid).catch(() => []) : Promise.resolve([]),
                    ]);
                    wallet      = w?.wallet || 0;
                    bank        = w?.bank || 0;
                    totalEarned = w?.total_earned || 0;
                    location    = ps?.location || 'tokyo';
                    petCount    = Array.isArray(pets)  ? pets.length  : 0;
                    charCount   = Array.isArray(chars) ? chars.length : 0;
                    if (prof?.[0]?.display_name) name = prof[0].display_name;
                } else {
                    const b = economy.getBalance(target);
                    wallet = b.wallet; bank = b.bank; totalEarned = b.total;
                }
            } else {
                const b = economy.getBalance(target);
                wallet = b.wallet; bank = b.bank; totalEarned = b.total;
            }
        } catch (e) {
            console.error('[profile:cloud]', e.message);
            const b = economy.getBalance(target);
            wallet = b.wallet; bank = b.bank; totalEarned = b.total;
        }

        const netWorth = wallet + bank;
        const rank = rankFor(netWorth);

        let hp = 100;
        try { if (healthMgr) hp = healthMgr.getStatus(target).health ?? 100; } catch (_) {}

        const text =
            `${SYMBOL} *Cursed Profile* — @${number}\n` +
            `${'━'.repeat(22)}\n\n` +
            `📱 Number   : +${number}\n` +
            `🏅 Rank     : ${rank.name}\n` +
            `📍 Location : ${location}\n` +
            `❤️ Health   : ${hp}/100\n\n` +
            `👛 Wallet   : *${wallet.toLocaleString()}*\n` +
            `🏦 Bank     : *${bank.toLocaleString()}*\n` +
            `📊 Net Worth: *${netWorth.toLocaleString()}*\n` +
            `📈 Earned   : *${totalEarned.toLocaleString()}*\n\n` +
            `🐾 Pets     : *${petCount}*\n` +
            `⚔️ Chars    : *${charCount}*\n\n` +
            `_${CURRENCY}_ — keep grinding 💪`;

        if (renderProfileCard) {
            try {
                const buf = await renderProfileCard({
                    name, number,
                    rank: rank.name, rankColor: rank.color,
                    wallet, bank, netWorth, totalEarned,
                    location, hp, petCount, charCount,
                });
                await sock.sendMessage(from, {
                    image: buf,
                    caption: text,
                    mentions: [target],
                }, { quoted: msg });
                return;
            } catch (e) {
                console.error('[profile:render]', e.message);
            }
        }

        await sock.sendMessage(from, { text, mentions: [target] }, { quoted: msg });
    },
};
