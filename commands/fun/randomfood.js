module.exports = {
    name: 'randomfood',
    description: 'Random Random food',
    category: 'fun',
    async execute({ reply }) {
        const items = ["ramen", "sushi", "jollof rice", "tacos", "pad thai", "pizza", "shawarma", "biryani", "gnocchi", "pho", "curry", "dumplings", "egusi", "samosa", "katsu"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random food: *${pick}*`);
    }
};
