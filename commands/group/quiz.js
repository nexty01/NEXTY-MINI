/**
 * Quiz Command — Start a quick group quiz question
 * Usage: .quiz
 */
const questions = [
    { q:'What is the capital of France?', a:'paris', hint:'It starts with P' },
    { q:'How many continents are there on Earth?', a:'7', hint:'Single digit number' },
    { q:'What planet is closest to the Sun?', a:'mercury', hint:'Starts with M' },
    { q:'Who wrote Romeo and Juliet?', a:'shakespeare', hint:'Famous English playwright' },
    { q:'What is 15 × 15?', a:'225', hint:'Between 200 and 250' },
    { q:'What gas makes up most of Earth\'s atmosphere?', a:'nitrogen', hint:'It\'s not oxygen!' },
    { q:'In which country is the Amazon Rainforest mostly located?', a:'brazil', hint:'Largest country in South America' },
    { q:'What is the chemical symbol for Gold?', a:'au', hint:'Two letters, not GD' },
    { q:'How many sides does an octagon have?', a:'8', hint:'Think "octo"' },
    { q:'What is the largest planet in our solar system?', a:'jupiter', hint:'Named after a Roman god' },
];
module.exports = {
    name: 'quiz',
    aliases: ['groupquiz', 'startquiz'],
    description: 'Start a quiz question in the group',
    category: 'group',
    async execute({ sock, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const q = questions[Math.floor(Math.random() * questions.length)];
        module.exports.currentAnswer = q.a;
        module.exports.currentGroup = from;
        await reply(
            `🧠 *GROUP QUIZ!*\n\n` +
            `❓ ${q.q}\n\n` +
            `💡 Hint: ${q.hint}\n\n` +
            `_First person to type the correct answer wins! You have 60 seconds!_`
        );
        setTimeout(async () => {
            if (module.exports.currentAnswer) {
                module.exports.currentAnswer = null;
                try { await sock.sendMessage(from, { text: `⏰ *Time's up!*\n\nThe answer was: *${q.a.toUpperCase()}*\n\nBetter luck next time! 🎯` }); }
                catch {}
            }
        }, 60000);
    }
};
