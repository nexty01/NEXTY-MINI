/**
 * GitHub Info Command
 * Usage: .githubinfo <username>
 */

const axios = require('axios');

module.exports = {
    name: 'githubinfo',
    aliases: ['ghinfo', 'github'],
    description: 'Get information about a GitHub user',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const username = args[0];
        if (!username) {
            return reply('🐙 Please provide a GitHub username.\nExample: .githubinfo pasquawisdom2007-beep');
        }

        try {
            const res = await axios.get(`https://api.github.com/users/${username}`);
            const data = res.data;

            const caption = `🐙 *GitHub User Info: ${data.login}*\n\n` +
                `👤 *Name:* ${data.name || 'N/A'}\n` +
                `📝 *Bio:* ${data.bio || 'N/A'}\n` +
                `🏢 *Company:* ${data.company || 'N/A'}\n` +
                `📍 *Location:* ${data.location || 'N/A'}\n` +
                `🌐 *Blog:* ${data.blog || 'N/A'}\n` +
                `📁 *Public Repos:* ${data.public_repos}\n` +
                `👥 *Followers:* ${data.followers}\n` +
                `🤝 *Following:* ${data.following}\n` +
                `🔗 *Profile:* ${data.html_url}`;

            await sock.sendMessage(from, {
                image: { url: data.avatar_url },
                caption: caption
            }, { quoted: msg });
        } catch (err) {
            console.error('[githubinfo]', err.message);
            reply('❌ User not found or GitHub API error.');
        }
    }
};
