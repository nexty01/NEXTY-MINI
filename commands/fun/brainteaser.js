module.exports = {
    name: 'brainteaser',
    aliases: ['puzzle'],
    description: 'Get a random brainteaser.',
    category: 'fun',
    async execute({ reply }) {
        const list = [
            { q: 'What has keys but cannot open locks?', a: 'A piano.' },
            { q: 'I speak without a mouth and hear without ears. What am I?', a: 'An echo.' },
            { q: 'The more you take, the more you leave behind. What are they?', a: 'Footsteps.' },
            { q: 'What can fill a room but takes no space?', a: 'Light.' },
            { q: 'What gets wetter the more it dries?', a: 'A towel.' },
        ];
        const x = list[Math.floor(Math.random()*list.length)];
        return reply('🧩 *Brainteaser*\n' + x.q + '\n\n_Answer:_ ||' + x.a + '||');
    }
};
