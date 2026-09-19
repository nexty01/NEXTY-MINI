const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'pay',
    aliases: ['transfer', 'give', 'send'],
    description: 'Transfer PASQUA Bucks to another user',
    category: 'economy',
    async execute({ reply, sender, args, msg }) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = mentioned?.[0];
        if (!target) return reply(`❌ Usage: \`.pay @user <amount>\``);
        if (target === sender) return reply(`🤦 You can't pay yourself!`);
        const amount = parseInt(args[1] || args[0]);
        if (!amount || amount <= 0) return reply(`❌ Please specify an amount! \`.pay @user 500\``);
        const r = economy.transfer(sender, target, amount);
        if (!r.success) return reply(`❌ ${r.reason}`);
        reply(`💸 *TRANSFER SUCCESSFUL!*\n\n${SYMBOL} *${amount.toLocaleString()} ${CURRENCY}*\n📤 From: You → @${target.split('@')[0]}\n\n👛 Your Wallet: *${r.fromWallet.toLocaleString()}*`, { mentions: [target] });
    }
};
