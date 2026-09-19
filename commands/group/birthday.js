/**
 * Birthday Command — Announce a birthday in the group
 * Usage: .birthday @user | .birthday @user <age>
 */
module.exports = {
    name: 'birthday',
    aliases: ['bday', 'hbd'],
    description: 'Announce a birthday for a group member',
    category: 'group',
    async execute({ reply, args, msg, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const target = mentioned[0] || null;
        const age = args.find(a => !isNaN(a));
        const cakes = ['🎂','🎉','🎊','🥳','🎁','🎈','🎀','✨'];
        const rand = () => cakes[Math.floor(Math.random()*cakes.length)];
        if (target) {
            reply(
                `${rand()}${rand()}${rand()} *HAPPY BIRTHDAY!* ${rand()}${rand()}${rand()}\n\n` +
                `🎉 Wishing @${target.split('@')[0]} a wonderful birthday!${age ? `\n\n🎂 Turning ${age} today!` : ''}\n\n` +
                `May all your wishes come true! 🌟\n\n` +
                `${rand()}${rand()}${rand()}`,
                { mentions: [target] }
            );
        } else {
            const name = args.join(' ') || 'Someone special';
            reply(`${rand()} *HAPPY BIRTHDAY ${name.toUpperCase()}!* ${rand()}\n\n🎉 Wishing you an amazing day filled with joy!\n\n${rand()}${rand()}${rand()}`);
        }
    }
};
