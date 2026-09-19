module.exports = {
    name: 'bonk',
    description: 'Bonk someone',
    category: 'fun',
    async execute({ args, reply, msg }) {
        const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || msg.message?.extendedTextMessage?.contextInfo?.participant
            || args.join(' ').trim()
            || 'them').split('@')[0];
        const lines = ["Bonk! {target} go to horny jail.", "{target} just got bonked.", "Bonking {target} as we speak."];
        const line = lines[Math.floor(Math.random()*lines.length)];
        return reply('🔨 ' + line.replace('{target}', '@' + target));
    }
};
