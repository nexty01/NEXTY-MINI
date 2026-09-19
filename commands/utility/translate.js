/**
 * Translate Command — Translate text to any language
 * Usage: .translate <lang_code> <text>
 */

const https = require('https');

function translateText(text, targetLang) {
    return new Promise((resolve, reject) => {
        const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${targetLang}&dt=t&q=${encodeURIComponent(text)}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    const translated = result[0].map(item => item[0]).join('');
                    const sourceLang = result[2];
                    resolve({ translated, sourceLang });
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = {
    name: 'translate',
    aliases: ['tr', 'trans'],
    description: 'Translate text to another language',
    category: 'utility',
    async execute({ reply, args }) {
        if (args.length < 2) {
            return reply(
                `🌐 *Translate Command*\n\n` +
                `Usage: .translate <language_code> <text>\n` +
                `Example: .translate es Hello World\n\n` +
                `Common codes: en (English), es (Spanish), fr (French), de (German), ` +
                `it (Italian), pt (Portuguese), ru (Russian), ja (Japanese), ko (Korean), ` +
                `zh (Chinese), ar (Arabic), hi (Hindi), id (Indonesian), tr (Turkish)`
            );
        }

        const targetLang = args[0].toLowerCase();
        const text = args.slice(1).join(' ');

        try {
            const { translated, sourceLang } = await translateText(text, targetLang);
            
            reply(
                `🌐 *Translation*\n\n` +
                `📝 Original (${sourceLang}):\n${text}\n\n` +
                `🔤 Translated (${targetLang}):\n${translated}`
            );
        } catch (err) {
            reply('❌ Translation failed. Please check the language code and try again.');
        }
    }
};
