module.exports = {
    name: 'randomcity',
    description: 'Random Random city',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Tokyo", "Lagos", "Paris", "Cairo", "Lima", "Berlin", "Mumbai", "Seoul", "Oslo", "Madrid", "Toronto", "Sydney", "Dakar", "Athens", "Prague"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random city: *${pick}*`);
    }
};
