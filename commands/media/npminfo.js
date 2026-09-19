/**
 * NPM Info Command
 * Usage: .npminfo <package-name>
 */

const axios = require('axios');

module.exports = {
    name: 'npminfo',
    aliases: ['npm'],
    description: 'Get information about an NPM package',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const pkg = args[0];
        if (!pkg) {
            return reply('📦 Please provide an NPM package name.\nExample: .npminfo axios');
        }

        try {
            const res = await axios.get(`https://registry.npmjs.org/${pkg}`);
            const data = res.data;
            const latest = data['dist-tags'].latest;
            const info = data.versions[latest];

            const caption = `📦 *NPM Package Info: ${data.name}*\n\n` +
                `🏷️ *Latest Version:* ${latest}\n` +
                `📝 *Description:* ${data.description || 'N/A'}\n` +
                `👤 *Author:* ${data.author?.name || 'N/A'}\n` +
                `📜 *License:* ${data.license || 'N/A'}\n` +
                `🔗 *Homepage:* ${data.homepage || 'N/A'}\n` +
                `📦 *NPM Link:* https://www.npmjs.com/package/${data.name}`;

            reply(caption);
        } catch (err) {
            console.error('[npminfo]', err.message);
            reply('❌ Package not found or NPM API error.');
        }
    }
};
