/**
 * ShortURL Command — Shorten long URLs
 * Usage: .shorturl <url>
 */

const https = require('https');

function shortenUrl(url) {
    return new Promise((resolve, reject) => {
        const apiUrl = `https://tinyurl.com/api-create.php?url=${encodeURIComponent(url)}`;
        https.get(apiUrl, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject);
    });
}

module.exports = {
    name: 'shorturl',
    aliases: ['shorten', 'tinyurl'],
    description: 'Shorten a long URL',
    category: 'utility',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply(
                `🔗 *URL Shortener*\n\n` +
                `Usage: .shorturl <long_url>\n` +
                `Example: .shorturl https://example.com/very/long/url`
            );
        }

        const url = args[0];
        
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            return reply('❌ Please provide a valid URL starting with http:// or https://');
        }

        try {
            const shortUrl = await shortenUrl(url);
            
            reply(
                `🔗 *URL Shortened*\n\n` +
                `📎 Original: ${url}\n` +
                `✂️ Short: ${shortUrl}`
            );
        } catch (err) {
            reply('❌ Failed to shorten URL. Please try again later.');
        }
    }
};
