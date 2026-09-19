module.exports = {
    name: 'uid',
    description: 'Generate a random UUID v4',
    category: 'utility',
    async execute({ reply }) {
        return reply('🔑 ' + require('crypto').randomUUID());
    }
};
