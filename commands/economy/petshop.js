const { PET_SHOP, SYMBOL } = require('../../utils/cloudEconomy');
module.exports = {
    name: 'petshop',
    aliases: ['pets-shop', 'shikigami'],
    description: 'List pets/shikigami you can tame',
    category: 'economy',
    async execute({ reply }) {
        let msg = `🐺 *SHIKIGAMI DEN — PET SHOP*\n\n`;
        for (const [id, p] of Object.entries(PET_SHOP)) {
            msg += `*${p.name}*\n${SYMBOL} ${p.price.toLocaleString()} • +${p.passive}/h\n_${p.description}_\nID: \`${id}\`\n\n`;
        }
        msg += `_Use_ \`.buypet <id>\` _to tame one._`;
        reply(msg);
    },
};
