const cloud = require('../../utils/cloudEconomy');
module.exports = {
    name: 'bmbuy',
    aliases: ['smuggle'],
    description: 'Buy from the Black Market',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const id = (args[0] || '').toLowerCase();
        const item = cloud.BLACK_MARKET[id];
        if (!item) return reply(`❌ Unknown item. \`.blackmarket\``);
        const linked = await cloud.requireLinked(sender, reply); if (!linked) return;
        const ps = await cloud.getPlayerState(linked.uid);
        if (ps.location !== 'shinjuku' && ps.location !== 'malevolent') return reply(`🔒 Travel to Shinjuku first.`);
        const w = await cloud.getWallet(linked.uid);
        if (w.wallet < item.price) return reply(`❌ Need ${cloud.SYMBOL} ${item.price.toLocaleString()}.`);
        await cloud.updateWallet(linked.uid, { wallet: w.wallet - item.price });
        await cloud.addToInventory(linked.uid, id);
        await cloud.logTx(linked.uid, `bm_${id}`, -item.price, { item: id, market: 'black' });
        reply(`💀 Smuggled *${item.name}*\n${cloud.SYMBOL} -${item.price.toLocaleString()}`);
    },
};
