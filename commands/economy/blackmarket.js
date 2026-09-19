const cloud = require('../../utils/cloudEconomy');
module.exports = {
    name: 'blackmarket',
    aliases: ['bm', 'black'],
    description: 'Browse the Black Market (Shinjuku only)',
    category: 'economy',
    async execute({ reply, sender }) {
        const linked = await cloud.requireLinked(sender, reply); if (!linked) return;
        const ps = await cloud.getPlayerState(linked.uid);
        if (ps.location !== 'shinjuku' && ps.location !== 'malevolent') {
            return reply(`🔒 Black Market is only in *Shinjuku*. Use \`.travel shinjuku\` first.`);
        }
        let msg = `💀 *BLACK MARKET — FORBIDDEN GOODS*\n\n`;
        for (const [id, it] of Object.entries(cloud.BLACK_MARKET)) {
            msg += `*${it.name}*\n${cloud.SYMBOL} ${it.price.toLocaleString()}\n_${it.description}_\n\`.bmbuy ${id}\`\n\n`;
        }
        reply(msg);
    },
};
