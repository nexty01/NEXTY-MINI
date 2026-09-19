const truths = [
    "What is your biggest fear?",
    "What is the most embarrassing thing that has ever happened to you?",
    "Have you ever lied to get out of trouble? What was the lie?",
    "What is your guilty pleasure?",
    "What is something you have never told your parents?",
    "Who was your first crush?",
    "What is the worst thing you have ever done?",
    "Have you ever cheated in a test or exam?",
    "What is the most childish thing you still do?",
    "If you could change one thing about yourself, what would it be?"
];

module.exports = {
    name: 'truth',
    aliases: ['truthquestion'],
    description: 'Get a random truth question',
    category: 'fun',
    async execute({ reply }) {
        const truth = truths[Math.floor(Math.random() * truths.length)];
        reply(`🤍 *TRUTH!*\n\n${truth}`);
    }
};
