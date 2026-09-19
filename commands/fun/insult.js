module.exports = {
    name: 'insult',
    description: 'Drop a (mild) insult.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'You bring everyone so much joy — when you leave the room.',
            'You have the perfect face for radio.',
            'I would agree with you, but then we would both be wrong.',
            'You are proof that evolution can go in reverse.',
            'Light travels faster than sound — that is why you seemed bright until you spoke.',
        ];
        return reply('🗯️ ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
