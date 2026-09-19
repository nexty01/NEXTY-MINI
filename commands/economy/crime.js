const cloud = require('../../utils/cloudEconomy');
const { renderCrimeCard } = require('../../utils/canvasRender');

module.exports = {
    name: 'crime',
    aliases: ['felony'],
    description: 'Commit a crime for high-risk reward (canvas card)',
    category: 'economy',
    async execute({ sock, m, sender, reply, args }) {
        const id = (args[0] || '').toLowerCase();
        if (!id) {
            let msg = `🔪 *CRIMES — pick one*\n\n`;
            for (const [k, c] of Object.entries(cloud.CRIMES)) {
                const rate = Math.round(c.successRate * 100);
                const cdMin = Math.round((c.cooldownMs || c.cooldownMin * 60000) / 60000);
                msg += `${c.emoji} *${c.name}* (\`${k}\`)\nReward: ${c.minPayout.toLocaleString()}–${c.maxPayout.toLocaleString()} | Fine: ${c.fine.toLocaleString()} | ${rate}% • CD ${cdMin}m\n\n`;
            }
            return reply(msg);
        }
        const crime = cloud.CRIMES[id];
        if (!crime) return reply(`❌ Unknown crime.`);
        const linked = await cloud.requireLinked(sender, reply);
        if (!linked) return;

        const cdMs = crime.cooldownMs || crime.cooldownMin * 60000;
        const cds = await cloud.getCooldowns(linked.uid);
        const last = cds[`crime_${id}`];
        if (last && Date.now() - last < cdMs) {
            const left = Math.ceil((cdMs - (Date.now() - last)) / 60000);
            return reply(`⏳ Cooldown: ${left}m remaining.`);
        }

        const ps = await cloud.getPlayerState(linked.uid);
        const malevolent = ps.location === 'malevolent';
        const success = Math.random() < crime.successRate;
        const w = await cloud.getWallet(linked.uid);

        let payout = 0, fine = 0, walletAfter = w.wallet;
        if (success) {
            payout = Math.floor(crime.minPayout + Math.random() * (crime.maxPayout - crime.minPayout));
            if (malevolent) payout *= 2;
            walletAfter = w.wallet + payout;
            await cloud.updateWallet(linked.uid, { wallet: walletAfter, total_earned: w.total_earned + payout });
        } else {
            fine = malevolent ? Math.floor(crime.fine * 1.5) : crime.fine;
            const lost = Math.min(fine, w.wallet);
            fine = lost;
            walletAfter = w.wallet - lost;
            await cloud.updateWallet(linked.uid, { wallet: walletAfter });
        }

        await cloud.logCrime(linked.uid, id, success, payout, success ? 0 : fine);
        await cloud.setCooldown(linked.uid, `crime_${id}`);
        await cloud.logTx(linked.uid, `crime_${id}_${success ? 'win' : 'fail'}`, success ? payout : -fine, { crime: id });

        try {
            const buf = await renderCrimeCard({
                name: crime.name,
                emoji: crime.emoji,
                success,
                payout,
                fine,
                walletAfter,
            });
            await sock.sendMessage(m.key.remoteJid, {
                image: buf,
                caption: success
                    ? `${crime.emoji} *${crime.name}* — *Pulled it off!*\n+${cloud.SYMBOL} ${payout.toLocaleString()}`
                    : `🚔 *${crime.name}* — *Caught!*\n-${cloud.SYMBOL} ${fine.toLocaleString()}`,
            }, { quoted: m });
        } catch (e) {
            reply(success
                ? `${crime.emoji} *Pulled it off!*\n+${cloud.SYMBOL} ${payout.toLocaleString()}`
                : `🚔 *Caught!*\n-${cloud.SYMBOL} ${fine.toLocaleString()}`);
        }
    },
};
