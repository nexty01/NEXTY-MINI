/**
 * Riddle Command — Get random riddles
 * Usage: .riddle
 */

const riddles = [
    { q: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", a: "A map" },
    { q: "What has keys but no locks?", a: "A piano" },
    { q: "What has a head and a tail but no body?", a: "A coin" },
    { q: "What gets wet while drying?", a: "A towel" },
    { q: "What can travel around the world while staying in a corner?", a: "A stamp" },
    { q: "What has hands but cannot clap?", a: "A clock" },
    { q: "What has a neck but no head?", a: "A bottle" },
    { q: "What building has the most stories?", a: "A library" },
    { q: "What goes up but never comes down?", a: "Your age" },
    { q: "What has one eye but can't see?", a: "A needle" },
    { q: "What has many teeth but can't bite?", a: "A comb" },
    { q: "What is full of holes but still holds water?", a: "A sponge" },
    { q: "What can you catch but not throw?", a: "A cold" },
    { q: "What has words but never speaks?", a: "A book" },
    { q: "What runs but never walks?", a: "A river" }
];

module.exports = {
    name: 'riddle',
    aliases: ['puzzle', 'brain'],
    description: 'Get a random riddle',
    category: 'fun',
    async execute({ reply }) {
        const riddle = riddles[Math.floor(Math.random() * riddles.length)];
        
        reply(
            `🧩 *Riddle*\n\n` +
            `${riddle.q}\n\n` +
            `Reply with ".answer" to reveal the answer!`
        );
        
        // Store the answer temporarily (in a real implementation, you'd use a more persistent solution)
        module.exports.lastAnswer = riddle.a;
    }
};
