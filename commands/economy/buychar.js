const cloud = require('../../utils/cloudEconomy');
module.exports = {
    name: 'buychar',
    aliases: ['summon'],
    description: 'Summon (buy) a JJK character',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const id = (args[0] || '').toLowerCase();
        const c = cloud.CHARACTERS[id];
        if (!c) return reply(`❌ Unknown character. \`.charactershop\``);
        const linked = await cloud.requireLinked(sender, reply); if (!linked) return;
        const w = await cloud.getWallet(linked.uid);
        if (w.wallet < c.price) return reply(`❌ Need ${cloud.SYMBOL} ${c.price.toLocaleString()}.`);
        const owned = await cloud.getCharacters(linked.uid);
        if (owned.find(x => x.character_id === id)) return reply(`⚠️ You already have ${c.emoji} ${c.name}.`);
        await cloud.updateWallet(linked.uid, { wallet: w.wallet - c.price });
        await cloud.addCharacter(linked.uid, id, c.rarity);
        await cloud.logTx(linked.uid, `char_${id}`, -c.price, { character: id });
        reply(`✨ Summoned ${c.emoji} *${c.name}* (${c.rarity})\n${cloud.SYMBOL} -${c.price.toLocaleString()}`);
    },
};
