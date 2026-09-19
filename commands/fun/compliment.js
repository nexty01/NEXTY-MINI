/**
 * Compliment Command — Give compliments
 * Usage: .compliment @user
 */

const compliments = [
    "You're more fun than a ball pit filled with candy.",
    "You're like a ray of sunshine on a rainy day.",
    "Your smile is contagious!",
    "You have the best laugh.",
    "You're more helpful than you realize.",
    "You're like a breath of fresh air.",
    "You light up the room.",
    "You have a great sense of humor.",
    "You're one of a kind!",
    "You make people feel special.",
    "Your positivity is infectious.",
    "You're awesome just the way you are!",
    "You have a heart of gold.",
    "You're making a difference.",
    "You're a true friend."
];

module.exports = {
    name: 'compliment',
    aliases: ['praise', 'nice'],
    description: 'Give someone a compliment',
    category: 'fun',
    async execute({ sock, msg, from, reply, args }) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        let targetUser = mentioned[0] || quotedParticipant;
        
        if (!targetUser && args.length > 0) {
            const input = args[0].replace(/[^0-9]/g, '');
            if (input) targetUser = input + '@s.whatsapp.net';
        }

        const compliment = compliments[Math.floor(Math.random() * compliments.length)];

        if (targetUser) {
            reply(
                `💝 *Compliment*\n\n` +
                `@${targetUser.split('@')[0]}, ${compliment}`,
                { mentions: [targetUser] }
            );
        } else {
            reply(`💝 *Compliment*\n\n${compliment}`);
        }
    }
};
