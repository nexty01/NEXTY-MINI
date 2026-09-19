/**
 * Roast Command — Light-hearted roasts
 * Usage: .roast @user
 */

const roasts = [
    "You're like a cloud. When you disappear, it's a beautiful day.",
    "I'm not saying you're stupid, but you have a face only a mother could love... from a distance.",
    "You're proof that evolution can go in reverse.",
    "I'd agree with you but then we'd both be wrong.",
    "You're not the dumbest person in the world, but you better hope they don't die.",
    "I'm jealous of people who don't know you.",
    "You're like a software update. Whenever I see you, I think 'Not now'.",
    "I'd explain it to you, but I left my crayons at home.",
    "You're not stupid; you just have bad luck thinking.",
    "If laughter is the best medicine, your face must be curing the world.",
    "You're the reason the gene pool needs a lifeguard.",
    "I'm not insulting you; I'm describing you.",
    "You're like a slinky - not really good for much, but you bring a smile when pushed down stairs.",
    "If I had a dollar for every time you said something smart, I'd be broke.",
    "You're not ugly; you're just not your type."
];

module.exports = {
    name: 'roast',
    aliases: ['burn', 'insult'],
    description: 'Roast someone playfully',
    category: 'fun',
    async execute({ sock, msg, from, reply, args, isGroup }) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        let targetUser = mentioned[0] || quotedParticipant;
        
        if (!targetUser && args.length > 0) {
            const input = args[0].replace(/[^0-9]/g, '');
            if (input) targetUser = input + '@s.whatsapp.net';
        }

        const roast = roasts[Math.floor(Math.random() * roasts.length)];

        if (targetUser) {
            reply(
                `🔥 *Roast Time*\n\n` +
                `@${targetUser.split('@')[0]}, ${roast}`,
                { mentions: [targetUser] }
            );
        } else {
            reply(`🔥 *Roast*\n\n${roast}`);
        }
    }
};
