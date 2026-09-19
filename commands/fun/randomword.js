module.exports = {
    name: 'randomword',
    description: 'Random Random word',
    category: 'fun',
    async execute({ reply }) {
        const items = ["nebula", "phantom", "vortex", "ember", "glacier", "sonnet", "rune", "oracle", "crimson", "solstice", "mirage", "umbra", "zenith", "cipher", "requiem"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random word: *${pick}*`);
    }
};
