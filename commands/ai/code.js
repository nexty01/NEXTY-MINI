/**
 * .code <question> — AI coding assistant.
 */
const { ask } = require('../../utils/smartAI');

module.exports = {
    name: 'code',
    aliases: ['codehelp', 'coder'],
    description: 'Get coding help from AI',
    category: 'ai',
    async execute({ reply, args, from, sender, isGroup }) {
        if (!args.length) {
            return reply('💻 *Code Assistant*\n\nUsage: .code <your programming question>\nExample: .code write a python function to reverse a string');
        }
        await reply('💻 *Coding...*');
        const out = await ask({
            key: 'code:' + (isGroup ? from : sender),
            system: 'You are an expert programming assistant. Give correct, concise code with a short explanation. Use fenced code blocks.',
            user: args.join(' '),
        });
        if (!out) return reply('❌ AI is busy right now. Try again in a moment.');
        reply(`💻 *Code*\n\n${out}`);
    },
};
