const { economy, SHOP_ITEMS } = require('../../utils/economyManager');
module.exports = {
    name: 'inventory',
    aliases: ['inv', 'items', 'backpack'],
    description: 'View your inventory',
    category: 'economy',
    async execute({ reply, sender }) {
        const inv = economy.getInventory(sender);
        const entries = Object.entries(inv).filter(([,q]) => q > 0);
        if (entries.length === 0) return reply(`🎒 *YOUR INVENTORY*\n\n_Empty! Visit \`.shop\` to buy items._`);
        let text = `🎒 *YOUR INVENTORY*\n\n`;
        for (const [id, qty] of entries) {
            const item = SHOP_ITEMS[id];
            text += `${item ? item.name : id} — x${qty}\n`;
        }
        text += `\n_Use \`.use <item_id>\` to activate!_`;
        reply(text);
    }
};
