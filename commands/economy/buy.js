const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'buy',
    aliases: ['purchase'],
    description: 'Buy an item from the shop',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const itemId = (args[0] || '').toLowerCase();
        if (!itemId) return reply(`❌ Usage: \`.buy <item_id>\`\n\nCheck \`.shop\` for available items!`);
        const r = economy.buyItem(sender, itemId);
        if (!r.success) return reply(`❌ ${r.reason}`);
        reply(`✅ *PURCHASED!*\n\n${r.item.name}\n${SYMBOL} -*${r.item.price.toLocaleString()} ${CURRENCY}*\n\n👛 Wallet: *${r.remaining.toLocaleString()}*\n\n_Use \`.use ${itemId}\` to activate it!_`);
    }
};
