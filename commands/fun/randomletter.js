module.exports = {
    name: 'randomletter',
    description: 'Random letter A–Z',
    category: 'fun',
    async execute({ reply }) {
        return reply('🔤 *' + String.fromCharCode(65 + Math.floor(Math.random()*26)) + '*');
    }
};
