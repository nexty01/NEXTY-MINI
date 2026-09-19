/**
 * Wiki Command — Search Wikipedia for a topic
 * Usage: .wiki <topic>
 */
const https = require('https');
function fetchWiki(query) {
    return new Promise((resolve, reject) => {
        const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(query)}`;
        https.get(url, { headers: { 'User-Agent': 'SUKUNA-MD-Bot/1.0' } }, res => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => { try { resolve(JSON.parse(data)); } catch { reject(new Error('Parse error')); } });
        }).on('error', reject);
    });
}
module.exports = {
    name: 'wiki',
    aliases: ['wikipedia', 'search'],
    description: 'Search Wikipedia for a topic',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) return reply('🔍 *Wikipedia*\n\nUsage: .wiki <topic>\nExample: .wiki Artificial Intelligence');
        const query = args.join(' ');
        try {
            const data = await fetchWiki(query);
            if (data.type === 'disambiguation' || !data.extract) {
                return reply(`🔍 Multiple results found for "*${query}*".\n\nTry being more specific!`);
            }
            const summary = data.extract.slice(0, 800) + (data.extract.length > 800 ? '...' : '');
            reply(`📖 *${data.title}*\n\n${summary}\n\n🔗 ${data.content_urls?.desktop?.page || ''}`);
        } catch (e) {
            reply(`❌ Could not find Wikipedia page for "*${query}*".\n\nTry different keywords.`);
        }
    }
};
