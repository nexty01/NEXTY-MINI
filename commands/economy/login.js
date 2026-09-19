const { loginLink, waNumber, SITE_URL } = require('../../utils/cloudEconomy');
module.exports = {
    name: 'login',
    aliases: ['link', 'website', 'site'],
    description: 'Get a personal link to log into the website and sync your progress',
    category: 'economy',
    async execute({ reply, sender }) {
        const wa = waNumber(sender);
        reply(
            `🔗 *Malevolent Kings — Web Login*\n\n` +
            `Tap the link below, sign up (or log in) using your WhatsApp number *${wa}*, ` +
            `and your bot wallet, inventory, pets and characters will sync automatically.\n\n` +
            `🌐 ${loginLink(wa)}\n\n` +
            `_Site: ${SITE_URL}_`
        );
    },
};
