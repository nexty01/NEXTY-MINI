module.exports = {
    name: 'datefmt',
    description: 'Show the current date in many formats',
    category: 'utility',
    async execute({ reply }) {
        const d = new Date();
        return reply(
            '🗓️ *Date Formats*\n' +
            '• ISO     : ' + d.toISOString() + '\n' +
            '• UTC     : ' + d.toUTCString() + '\n' +
            '• Local   : ' + d.toString() + '\n' +
            '• Day     : ' + d.toLocaleDateString('en-GB', { weekday: 'long' }) + '\n' +
            '• YMD     : ' + d.toISOString().slice(0,10)
        );
    }
};
