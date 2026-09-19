module.exports = {
    name: 'burn',
    description: 'Burn someone',
    category: 'fun',
    async execute({ args, reply, msg }) {
        const target = (msg.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
            || msg.message?.extendedTextMessage?.contextInfo?.participant
            || args.join(' ').trim()
            || 'them').split('@')[0];
        const lines = ["Roasting {target} like marshmallows over hellfire.", "I would insult {target} but reality already did.", "{target} brings nothing to the table \u2014 not even the table."];
        const line = lines[Math.floor(Math.random()*lines.length)];
        return reply('🔥 ' + line.replace('{target}', '@' + target));
    }
};
