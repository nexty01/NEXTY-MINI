const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
const cloud = require('../../utils/cloudEconomy');
const { renderEarningsCard } = require('../../utils/canvasRender');

const RESPONSES = [
    { giver: 'Elon Musk',         msg: 'tossed you some change' },
    { giver: 'A kind stranger',   msg: 'felt bad and gave you' },
    { giver: 'Your grandma',      msg: 'slipped you some cash' },
    { giver: 'MrBeast',           msg: 'gave you a small tip' },
    { giver: 'A rich kid',        msg: 'flexed and dropped' },
    { giver: 'Nobody',            msg: 'cared… you got nothing' },
    { giver: 'A dog',             msg: 'dropped a coin from its mouth' },
    { giver: 'The PASQUA bot',    msg: 'took pity on you' },
];

module.exports = {
    name: 'beg',
    aliases: [],
    description: 'Beg for spare PASQUA Bucks (canvas card)',
    category: 'economy',
    async execute({ sock, m, sender, reply }) {
        const cd = economy.checkCooldown(sender, 'beg');
        if (cd.onCooldown) {
            return reply(`⏰ Stop begging so much!\n\n⏳ Try again in *${formatTime(cd.remaining)}*`);
        }
        const resp = RESPONSES[Math.floor(Math.random() * RESPONSES.length)];
        economy.setCooldown(sender, 'beg');

        const amount = resp.giver === 'Nobody' ? 0 : Math.floor(Math.random() * 451) + 50;
        if (amount > 0) economy.addWallet(sender, amount);

        let walletAfter = economy.getBalance(sender).wallet;
        try {
            const uid = await cloud.getUserIdByWa(cloud.waNumber(sender));
            if (uid && amount > 0) {
                const w = await cloud.getWallet(uid);
                const next = w.wallet + amount;
                await cloud.updateWallet(uid, { wallet: next, total_earned: w.total_earned + amount });
                await cloud.logTx(uid, 'beg', amount, { giver: resp.giver });
                walletAfter = next;
            }
        } catch (_) {}

        try {
            const buf = await renderEarningsCard({
                title:    'BEG',
                subtitle: `${resp.giver} ${resp.msg}`,
                amount,
                walletAfter,
                accent: amount > 0 ? '#fbbf24' : '#6b7280',
            });
            await sock.sendMessage(m.key.remoteJid, {
                image: buf,
                caption: `🙏 *${resp.giver}* ${resp.msg}${amount > 0 ? `\n${SYMBOL} +${amount.toLocaleString()} ${CURRENCY}` : ''}`,
            }, { quoted: m });
        } catch (e) {
            reply(`🙏 *${resp.giver}* ${resp.msg}${amount > 0 ? `\n\n${SYMBOL} +*${amount.toLocaleString()} ${CURRENCY}*` : ''}`);
        }
    },
};
