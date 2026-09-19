const { economy, CURRENCY, SYMBOL, SHOP_ITEMS } = require('../../utils/economyManager');
module.exports = {
    name: 'shop',
    aliases: ['store', 'market'],
    description: 'Browse the PASQUA shop',
    category: 'economy',
    async execute({ reply, sender }) {
        let text = `🛒 *P A S Q U A   S H O P* 🛒\n\n`;
        let i = 1;
        for (const [id, item] of Object.entries(SHOP_ITEMS)) {
            text += `*${i}.* ${item.name}\n   💵 Price: *${item.price.toLocaleString()}*\n   📝 ${item.description}\n   🔑 ID: \`${id}\`\n\n`;
            i++;
        }
        text += `━━━━━━━━━━━━━━━━━━━━━\n👛 Your Wallet: *${economy.getBalance(sender).wallet.toLocaleString()} ${CURRENCY}*\n\n_Use \`.buy <item_id>\` to purchase!_`;
        reply(text);
    }
};
