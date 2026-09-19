/**
 * Define Command — Get word definitions
 * Usage: .define <word>
 */

const https = require('https');

function getDefinition(word) {
    return new Promise((resolve, reject) => {
        const url = `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`;
        https.get(url, { timeout: 10000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve(JSON.parse(data));
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

module.exports = {
    name: 'define',
    aliases: ['dictionary', 'meaning', 'def'],
    description: 'Get the definition of a word',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) {
            return reply(
                `📚 *Dictionary*\n\n` +
                `Usage: .define <word>\n` +
                `Example: .define serendipity`
            );
        }

        const word = args[0].toLowerCase();
        
        try {
            const data = await getDefinition(word);
            
            if (data.title === 'No Definitions Found') {
                return reply(`❌ No definition found for "${word}".`);
            }

            const entry = data[0];
            let response = `📚 *Definition: ${entry.word}*\n`;
            
            if (entry.phonetic) {
                response += `🔊 ${entry.phonetic}\n`;
            }
            response += `\n`;

            entry.meanings.slice(0, 3).forEach((meaning, idx) => {
                response += `*${idx + 1}. ${meaning.partOfSpeech}*\n`;
                meaning.definitions.slice(0, 2).forEach((def, dIdx) => {
                    response += `   ${dIdx + 1}. ${def.definition}\n`;
                    if (def.example) {
                        response += `      💬 "${def.example}"\n`;
                    }
                });
                response += `\n`;
            });

            reply(response);
        } catch (err) {
            reply(`❌ Could not find definition for "${word}".`);
        }
    }
};
