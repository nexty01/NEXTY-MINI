const predictions = [
    "✨ The stars say YES — go for it!",
    "🔮 The future is uncertain, but fortune favors the bold.",
    "❌ The signs point to NO — wait for a better time.",
    "⚡ A great opportunity is coming your way soon.",
    "🌙 The answer you seek lies within yourself.",
    "🎯 Focus and you will succeed.",
    "🌊 Change is coming — embrace it.",
    "🕊️ Peace and good luck surround you.",
    "🔥 Your passion will lead you to victory.",
    "⏳ Patience is required — good things take time."
];

module.exports = {
    name: 'predict',
    aliases: ['prediction', 'future'],
    description: 'Get a prediction',
    category: 'fun',
    async execute({ reply, args }) {
        const question = args.join(' ') || 'your question';
        const prediction = predictions[Math.floor(Math.random() * predictions.length)];
        reply(`🔮 *Prediction for "${question}"*\n\n${prediction}`);
    }
};
