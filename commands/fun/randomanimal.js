module.exports = {
    name: 'randomanimal',
    description: 'Random Random animal',
    category: 'fun',
    async execute({ reply }) {
        const items = ["Wolf", "Tiger", "Panther", "Eagle", "Fox", "Lion", "Bear", "Owl", "Raven", "Cobra", "Falcon", "Lynx", "Stag", "Shark", "Dragon"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random animal: *${pick}*`);
    }
};
