module.exports = {
    name: 'simp',
    description: 'Simp someone',
    category: 'fun',
    async execute({ args, reply, msg }) {
        const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || msg.message?.extendedTextMessage?.contextInfo?.participant
            || args.join(' ').trim()
            || 'them').split('@')[0];
        const lines = ["{target} is simping HARD right now.", "Certified simp alert for {target}.", "{target} would walk through fire for them."];
        const line = lines[Math.floor(Math.random()*lines.length)];
        return reply('💘 ' + line.replace('{target}', '@' + target));
    }
};
