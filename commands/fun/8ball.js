/**
 * 8Ball Command — Magic 8-ball answers
 * Usage: .8ball <question>
 */

const responses = [
    '🎱 It is certain.',
    '🎱 It is decidedly so.',
    '🎱 Without a doubt.',
    '🎱 Yes definitely.',
    '🎱 You may rely on it.',
    '🎱 As I see it, yes.',
    '🎱 Most likely.',
    '🎱 Outlook good.',
    '🎱 Yes.',
    '🎱 Signs point to yes.',
    '🎱 Reply hazy, try again.',
    '🎱 Ask again later.',
    '🎱 Better not tell you now.',
    '🎱 Cannot predict now.',
    '🎱 Concentrate and ask again.',
    '🎱 Don\'t count on it.',
    '🎱 My reply is no.',
    '🎱 My sources say no.',
    '🎱 Outlook not so good.',
    '🎱 Very doubtful.'
];

module.exports = {
    name: '8ball',
    aliases: ['magicball', 'ask'],
    description: 'Ask the magic 8-ball a question',
    category: 'fun',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply(
                `🎱 *Magic 8-Ball*\n\n` +
                `Usage: .8ball <question>\n` +
                `Example: .8ball Will I be rich?`
            );
        }

        const question = args.join(' ');
        const answer = responses[Math.floor(Math.random() * responses.length)];

        reply(
            `🎱 *Magic 8-Ball*\n\n` +
            `Q: ${question}\n` +
            `A: ${answer}`
        );
    }
};
