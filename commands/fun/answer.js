/**
 * Answer Command — Reveal riddle answer
 * Usage: .answer
 */

module.exports = {
    name: 'answer',
    aliases: ['reveal', 'solve'],
    description: 'Reveal the answer to the last riddle',
    category: 'fun',
    async execute({ reply }) {
        const lastRiddle = require('./riddle');
        
        if (lastRiddle.lastAnswer) {
            reply(
                `🧩 *Answer*\n\n` +
                `The answer is: *${lastRiddle.lastAnswer}*`
            );
            delete lastRiddle.lastAnswer;
        } else {
            reply('❌ No riddle has been asked recently. Use .riddle first!');
        }
    }
};
