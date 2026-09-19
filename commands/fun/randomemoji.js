module.exports = {
    name: 'randomemoji',
    description: 'Random Random emoji',
    category: 'fun',
    async execute({ reply }) {
        const items = ["\ud83d\udd25", "\ud83d\udc80", "\ud83d\udc41\ufe0f", "\ud83c\udf0c", "\u26a1", "\ud83e\ude78", "\u2728", "\ud83c\udf19", "\ud83d\udde1\ufe0f", "\ud83d\udc0d", "\ud83c\udf38", "\ud83c\udf00", "\u2620\ufe0f", "\ud83e\udd8a", "\ud83d\udc3a", "\ud83d\udc51"];
        const pick = items[Math.floor(Math.random()*items.length)]; return reply(`Random emoji: *${pick}*`);
    }
};
