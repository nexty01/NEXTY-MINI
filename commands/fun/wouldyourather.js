module.exports = {
    name: 'wouldyourather',
    aliases: ['wyr'],
    description: 'Random would-you-rather.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'Would you rather *be invisible* or *be able to fly*?',
            'Would you rather *fight 100 duck-sized horses* or *1 horse-sized duck*?',
            'Would you rather *know the future* or *change the past*?',
            'Would you rather *speak every language* or *play every instrument*?',
            'Would you rather *teleport anywhere* or *stop time*?',
        ];
        return reply('🤔 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
