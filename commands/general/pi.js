module.exports = {
    name: 'pi',
    description: 'Show pi to N decimal places (max 100).',
    category: 'general',
    async execute({ args, reply }) {
        const n = Math.min(Math.max(parseInt(args[0]) || 10, 1), 100);
        const PI = '3.1415926535897932384626433832795028841971693993751058209749445923078164062862089986280348253421170679';
        return reply('🥧 *π* to ' + n + ' decimals\n' + PI.slice(0, n+2));
    }
};
