/**
 * Restart Command — Restart the bot process
 * Usage: .restart
 */
const database = require('../../utils/database');
module.exports = {
    name: 'restart',
    aliases: ['reboot', 'reload'],
    description: 'Restart the bot (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ reply, sock }) {
        await reply('🔄 *Restarting SUKUNA MD...*\n\n_Please wait a few seconds._');
        setTimeout(() => {
            console.log('[RESTART] Owner triggered restart.');
            process.exit(0); // Pterodactyl / PM2 will auto-restart
        }, 2000);
    }
};
