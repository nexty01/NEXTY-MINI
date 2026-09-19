const { economy, CURRENCY, SYMBOL, formatTime } = require('../../utils/economyManager');
module.exports = {
    name: 'rob',
    aliases: ['steal'],
    description: 'Attempt to rob another user',
    category: 'economy',
    async execute({ reply, sender, args, msg }) {
        const cd = economy.checkCooldown(sender, 'rob');
        if (cd.onCooldown) return reply(`⏰ Lay low for *${formatTime(cd.remaining)}* before robbing again!`);
        
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid;
        const target = mentioned?.[0];
        if (!target) return reply(`❌ Usage: \`.rob @user\`\n\nMention someone to rob them!`);
        if (target === sender) return reply(`🤦 You can't rob yourself!`);
        
        const targetBal = economy.getBalance(target);
        if (targetBal.wallet < 100) return reply(`😅 That person is too broke to rob! They only have *${targetBal.wallet}* in their wallet.`);
        
        if (economy.hasActiveEffect(target, 'shield')) {
            economy.setCooldown(sender, 'rob');
            return reply(`🛡️ *BLOCKED!*\n\nThat user has an active Shield! Your robbery failed and you got nothing.`);
        }
        
        let successRate = 0.4;
        if (economy.hasActiveEffect(sender, 'robbermask')) successRate += 0.2;
        
        economy.setCooldown(sender, 'rob');
        
        if (Math.random() < successRate) {
            const maxSteal = Math.min(Math.floor(targetBal.wallet * 0.4), 5000);
            const stolen = Math.floor(Math.random() * maxSteal) + 100;
            economy.removeWallet(target, stolen);
            economy.addWallet(sender, stolen);
            reply(`🔫 *ROBBERY SUCCESSFUL!*\n\n😈 You stole *${stolen.toLocaleString()} ${CURRENCY}* from @${target.split('@')[0]}!\n\n👛 Your Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`, { mentions: [target] });
        } else {
            const fine = Math.floor(Math.random() * 500) + 200;
            economy.removeWallet(sender, fine);
            reply(`🚔 *BUSTED!*\n\n👮 You got caught trying to rob @${target.split('@')[0]}!\nYou paid a *${fine.toLocaleString()} ${CURRENCY}* fine.\n\n👛 Wallet: *${economy.getBalance(sender).wallet.toLocaleString()}*`, { mentions: [target] });
        }
    }
};
