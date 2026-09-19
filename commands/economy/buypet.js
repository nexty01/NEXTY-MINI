const cloud = require('../../utils/cloudEconomy');
module.exports = {
    name: 'buypet',
    aliases: ['tame'],
    description: 'Buy/tame a pet',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const id = (args[0] || '').toLowerCase();
        const pet = cloud.PET_SHOP[id];
        if (!pet) return reply(`❌ Unknown pet. Use \`.petshop\` to see options.`);
        const linked = await cloud.requireLinked(sender, reply); if (!linked) return;
        const w = await cloud.getWallet(linked.uid);
        if (w.wallet < pet.price) return reply(`❌ Need ${cloud.SYMBOL} ${pet.price.toLocaleString()}, have ${w.wallet.toLocaleString()}.`);
        await cloud.updateWallet(linked.uid, { wallet: w.wallet - pet.price });
        await cloud.addPet(linked.uid, id, pet.name);
        await cloud.logTx(linked.uid, `pet_${id}`, -pet.price, { pet: id });
        reply(`✅ Tamed *${pet.name}*\n${cloud.SYMBOL} -${pet.price.toLocaleString()} • Wallet: ${(w.wallet - pet.price).toLocaleString()}`);
    },
};
