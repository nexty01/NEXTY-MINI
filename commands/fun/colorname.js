module.exports = {
    name: 'colorname',
    description: 'Random Random color',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Crimson", "Obsidian", "Azure", "Emerald", "Violet", "Amber", "Ivory", "Magenta", "Cyan", "Onyx", "Saffron", "Indigo", "Coral", "Teal", "Lavender"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random color: *${pick}*`);
    }
};
