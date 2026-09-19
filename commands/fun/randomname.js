module.exports = {
    name: 'randomname',
    description: 'Random Random name',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Sukuna", "Yuji", "Nobara", "Megumi", "Gojo", "Aizen", "Naruto", "Sasuke", "Luffy", "Zoro", "Tanjiro", "Nezuko", "Eren", "Mikasa", "Levi", "Light", "Lelouch", "Vegeta", "Goku", "Ichigo"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random name: *${pick}*`);
    }
};
