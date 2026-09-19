const cloud = require('../../utils/cloudEconomy');
module.exports = {
    name: 'mypets',
    aliases: ['pets'],
    description: 'List your tamed pets',
    category: 'economy',
    async execute({ reply, sender }) {
        const linked = await cloud.requireLinked(sender, reply); if (!linked) return;
        const pets = await cloud.getPets(linked.uid);
        if (!pets.length) return reply(`🦴 You have no pets. Try \`.petshop\`.`);
        let msg = `🐺 *YOUR SHIKIGAMI*\n\n`;
        pets.forEach(p => { msg += `• ${cloud.PET_SHOP[p.pet_id]?.name || p.pet_id} — Lv ${p.level}\n`; });
        reply(msg);
    },
};
