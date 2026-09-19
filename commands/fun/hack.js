/**
 * Hack Command — Fake hacking animation
 * Usage: .hack @user
 */

module.exports = {
    name: 'hack',
    aliases: ['fakehack', 'hacker'],
    description: 'Fake hacking animation',
    category: 'fun',
    async execute({ sock, msg, from, reply, args }) {
        const mentioned = msg.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
        const quotedParticipant = msg.message?.extendedTextMessage?.contextInfo?.participant;
        
        let targetUser = mentioned[0] || quotedParticipant;
        
        if (!targetUser && args.length > 0) {
            const input = args[0].replace(/[^0-9]/g, '');
            if (input) targetUser = input + '@s.whatsapp.net';
        }

        if (!targetUser) {
            return reply('Usage: .hack @user or reply to a user');
        }

        const userNumber = targetUser.split('@')[0];
        const messages = [
            '🔍 *Initializing hack sequence...*',
            '💻 *Connecting to target device...*',
            '🔓 *Bypassing security protocols...*',
            '📡 *Accessing camera...*',
            '📂 *Downloading personal data...*',
            '💳 *Accessing bank accounts...*',
            '📱 *Reading messages...*',
            '🎭 *Hacking complete!*'
        ];

        let currentMsg = await reply(`👨‍💻 *Hacking @${userNumber}...*\n\n${messages[0]}`, { mentions: [targetUser] });

        for (let i = 1; i < messages.length; i++) {
            await new Promise(r => setTimeout(r, 1500));
            try {
                currentMsg = await sock.sendMessage(from, {
                    text: `👨‍💻 *Hacking @${userNumber}...*\n\n${messages[i]}`,
                    edit: currentMsg.key,
                    mentions: [targetUser]
                });
            } catch (e) {
                currentMsg = await sock.sendMessage(from, {
                    text: `👨‍💻 *Hacking @${userNumber}...*\n\n${messages[i]}`,
                    mentions: [targetUser]
                });
            }
        }

        await new Promise(r => setTimeout(r, 1000));
        reply(
            `🎭 *HACK COMPLETE* 🎭\n\n` +
            `Target: @${userNumber}\n` +
            `Status: ✅ Successfully hacked\n` +
            `Data stolen: 69TB\n` +
            `Bank balance: $4.20\n\n` +
            `> *This was just a prank!* 😄`,
            { mentions: [targetUser] }
        );
    }
};
