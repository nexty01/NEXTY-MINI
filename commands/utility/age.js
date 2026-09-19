module.exports = {
    name: 'age',
    description: 'Age calculator. Usage: .age YYYY-MM-DD',
    category: 'utility',
    async execute({ args, reply }) {
        const d = new Date(args[0]);
        if (isNaN(d)) return reply('Usage: .age 2000-05-21');
        const ms = Date.now() - d.getTime();
        const years = ms / (365.25*24*3600*1000);
        const days  = Math.floor(ms / (24*3600*1000));
        return reply('🎂 *Age*\n• Years: ' + years.toFixed(2) + '\n• Days : ' + days);
    }
};
