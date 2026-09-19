const { economy } = require('../../utils/economyManager');
module.exports = {
    name: 'use',
    aliases: ['activate'],
    description: 'Use an item from your inventory',
    category: 'economy',
    async execute({ reply, sender, args }) {
        const itemId = (args[0] || '').toLowerCase();
        if (!itemId) return reply(`❌ Usage: \`.use <item_id>\`\n\nCheck \`.inventory\` for your items!`);
        const r = economy.useItem(sender, itemId);
        if (!r.success) return reply(`❌ ${r.reason}`);
        reply(`✅ *ACTIVATED!*\n\n${r.item.name}\n📝 ${r.item.description}\n\n${r.item.duration > 0 ? `⏱️ Active for *${Math.round(r.item.duration / 60000)} minutes*` : '🎯 Effect applied!'}`);
    }
};
