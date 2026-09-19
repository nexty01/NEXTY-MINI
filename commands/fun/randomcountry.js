module.exports = {
    name: 'randomcountry',
    description: 'Random Random country',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Japan", "Brazil", "Norway", "Egypt", "Canada", "Nigeria", "Kenya", "India", "Germany", "France", "Italy", "Mexico", "Australia", "Turkey", "Spain"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random country: *${pick}*`);
    }
};
