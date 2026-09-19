const { economy, CURRENCY, SYMBOL } = require('../../utils/economyManager');
module.exports = {
    name: 'gift',
    aliases: ['give', 'send'],
    description: 'Gift PASQUA Bucks to another user',
    category: 'economy',
    async execute({ reply, sender, args, msg }) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = mentioned?.[0];
        if (!target) return reply(`🎁 *Gift*\n\nUsage: .gift @user <amount>\nExample: .gift @friend 500`);
        if (target === sender) return reply('❌ You cannot gift yourself!');
        const amount = parseInt(args.find(a => !isNaN(a)));
        if (!amount || amount < 1) return reply('❌ Enter a valid amount to gift.\nExample: .gift @user 500');
        const bal = economy.getBalance(sender);
        if (bal.wallet < amount) return reply(`❌ Insufficient funds!\n\nYour wallet: *${bal.wallet.toLocaleString()}*\nRequired: *${amount.toLocaleString()}*`);
        economy.removeWallet(sender, amount);
        economy.addWallet(target, amount);
        const newBal = economy.getBalance(sender);
        reply(
            `🎁 *Gift Sent!*\n\n` +
            `👤 From: @${sender.split('@')[0]}\n` +
            `🎯 To: @${target.split('@')[0]}\n` +
            `${SYMBOL} Amount: *${amount.toLocaleString()} ${CURRENCY}*\n\n` +
            `👛 Your new balance: *${newBal.wallet.toLocaleString()}*`,
            { mentions: [sender, target] }
        );
    }
};
