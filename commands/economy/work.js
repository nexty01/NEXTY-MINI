const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
const cloud = require('../../utils/cloudEconomy');
const { renderEarningsCard } = require('../../utils/canvasRender');

const JOBS = [
    { title: '👨‍🍳 Chef', msg: 'You cooked a 5-star meal' },
    { title: '💻 Developer', msg: 'You squashed 42 bugs' },
    { title: '🧹 Janitor', msg: 'You cleaned the entire building' },
    { title: '🎨 Artist', msg: 'You painted a masterpiece' },
    { title: '🚗 Uber Driver', msg: 'You drove passengers across town' },
    { title: '📦 Delivery Driver', msg: 'You delivered 30 packages' },
    { title: '🎤 DJ', msg: 'You rocked the club all night' },
    { title: '🧑‍🔬 Scientist', msg: 'You discovered a new element' },
    { title: '🎬 Actor', msg: 'You nailed the audition' },
    { title: '🏗️ Builder', msg: 'You built a skyscraper' },
    { title: '🧑‍🚀 Astronaut', msg: 'You orbited Earth twice' },
    { title: '🎮 Streamer', msg: 'You went viral on Twitch' },
    { title: '🍕 Pizza Guy', msg: 'You delivered 50 pizzas in record time' },
    { title: '💈 Barber', msg: 'You gave the freshest fades in town' },
];

module.exports = {
    name: 'work',
    aliases: ['job'],
    description: 'Work a random job for PASQUA Bucks (canvas card)',
    category: 'economy',
    async execute({ sock, m, sender, reply }) {
        const cd = economy.checkCooldown(sender, 'work');
        if (cd.onCooldown) {
            return reply(`⏰ You're still tired from your last shift!\n\n⏳ Rest for *${formatTime(cd.remaining)}* more`);
        }

        const job = JOBS[Math.floor(Math.random() * JOBS.length)];
        let amount = Math.floor(Math.random() * 1301) + 200;
        if (economy.hasActiveEffect(sender, 'xpbooster')) amount *= 2;

        // Update local economy
        economy.addWallet(sender, amount);
        economy.setCooldown(sender, 'work');

        // Mirror to cloud if linked
        let walletAfter = economy.getBalance(sender).wallet;
        try {
            const uid = await cloud.getUserIdByWa(cloud.waNumber(sender));
            if (uid) {
                const w = await cloud.getWallet(uid);
                const next = w.wallet + amount;
                await cloud.updateWallet(uid, { wallet: next, total_earned: w.total_earned + amount });
                await cloud.logTx(uid, 'work', amount, { job: job.title });
                walletAfter = next;
            }
        } catch (_) {}

        try {
            const buf = await renderEarningsCard({
                title:    `WORK · ${job.title.replace(/[^\w\s]/g, '').trim().toUpperCase()}`,
                subtitle: job.msg,
                amount,
                walletAfter,
                accent: '#22c55e',
            });
            await sock.sendMessage(m.key.remoteJid, {
                image: buf,
                caption: `${job.title}\n${job.msg} — *+${amount.toLocaleString()} ${CURRENCY}* ${SYMBOL}`,
            }, { quoted: m });
        } catch (e) {
            reply(`${job.title}\n\n${job.msg} and earned *${amount.toLocaleString()} ${CURRENCY}*! ${SYMBOL}\n\n👛 Wallet: *${walletAfter.toLocaleString()}*`);
        }
    },
};
