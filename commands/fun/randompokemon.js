module.exports = {
    name: 'randompokemon',
    description: 'Random Random pokémon',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Pikachu", "Charizard", "Lucario", "Greninja", "Gengar", "Mewtwo", "Eevee", "Snorlax", "Garchomp", "Dragonite"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random pokémon: *${pick}*`);
    }
};
