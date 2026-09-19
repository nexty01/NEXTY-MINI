module.exports = {
    name: 'randomdrink',
    description: 'Random Random drink',
    category: 'fun',
    async execute({ reply }) {
        const items = ["matcha", "espresso", "chapman", "mojito", "sake", "kombucha", "lemonade", "hibiscus tea", "horchata", "iced latte"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random drink: *${pick}*`);
    }
};
