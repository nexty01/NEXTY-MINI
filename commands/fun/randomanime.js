module.exports = {
    name: 'randomanime',
    description: 'Random Random anime',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Jujutsu Kaisen", "Bleach", "Naruto", "One Piece", "Demon Slayer", "AOT", "Death Note", "Code Geass", "Hunter x Hunter", "DBZ", "Chainsaw Man", "Vinland Saga"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random anime: *${pick}*`);
    }
};
