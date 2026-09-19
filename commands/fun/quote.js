const quotes = [
    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
    { text: "It does not matter how slowly you go as long as you do not stop.", author: "Confucius" },
    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
    { text: "The way to get started is to quit talking and begin doing.", author: "Walt Disney" },
    { text: "Don't watch the clock; do what it does. Keep going.", author: "Sam Levenson" }
];

module.exports = {
    name: 'quote',
    aliases: ['quotes', 'inspire'],
    description: 'Get an inspirational quote',
    category: 'fun',
    async execute({ reply }) {
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        reply(`💬 *Quote of the Moment*\n\n_"${q.text}"_\n\n— *${q.author}*`);
    }
};
