const axios = require('axios');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Generate TTS audio from text
async function generateTTS(text) {
    try {
        const res = await axios.get('https://api.allorigins.win/raw?url=' + encodeURIComponent(
            `https://tts.google.com/client.updateSettings?eng=en&v=1`
        ), { timeout: 15000 });
        
        const ttsUrl = `https://translate.google.com/translate_tts?client=gtx&ie=UTF-8&tl=en&q=${encodeURIComponent(text.substring(0, 200))}`;
        const audio = await axios.get(ttsUrl, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        return audio.data ? Buffer.from(audio.data) : null;
    } catch (err) {
        console.error('[tts generation]', err.message);
        return null;
    }
}

// Combine multiple audio buffers using ffmpeg
async function combineAudioBuffers(audioBuffers) {
    return new Promise((resolve) => {
        let ffmpegPath = null;
        try { ffmpegPath = require('ffmpeg-static'); } catch (_) { ffmpegPath = null; }
        
        if (!ffmpegPath || audioBuffers.length === 0) return resolve(null);
        
        const tempDir = path.join(__dirname, '../../tmp');
        if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
        
        const inputFiles = audioBuffers.map((buf, i) => {
            const file = path.join(tempDir, `audio_${Date.now()}_${i}.mp3`);
            fs.writeFileSync(file, buf);
            return file;
        });
        
        const concatFile = path.join(tempDir, `concat_${Date.now()}.txt`);
        const concatContent = inputFiles.map(f => `file '${f}'`).join('\n');
        fs.writeFileSync(concatFile, concatContent);
        
        const args = [
            '-hide_banner', '-loglevel', 'error',
            '-f', 'concat', '-safe', '0', '-i', concatFile,
            '-c', 'copy',
            '-f', 'mp3',
            'pipe:1'
        ];
        
        const ff = spawn(ffmpegPath, args);
        const chunks = [];
        
        ff.stdout.on('data', c => chunks.push(c));
        ff.on('error', () => {
            inputFiles.forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
            try { fs.unlinkSync(concatFile); } catch (_) {}
            resolve(null);
        });
        ff.on('close', code => {
            inputFiles.forEach(f => { try { fs.unlinkSync(f); } catch (_) {} });
            try { fs.unlinkSync(concatFile); } catch (_) {}
            
            if (code !== 0 || chunks.length === 0) return resolve(null);
            resolve(Buffer.concat(chunks));
        });
        ff.stdin.on('error', () => {});
        ff.stdin.end();
    });
}

// Transcode MP3 to OGG/Opus for WhatsApp voice notes
function transcodeMp3ToOpus(mp3Buffer) {
    return new Promise((resolve) => {
        let ffmpegPath = null;
        try { ffmpegPath = require('ffmpeg-static'); } catch (_) { ffmpegPath = null; }
        
        if (!ffmpegPath) return resolve(null);
        
        const args = [
            '-hide_banner', '-loglevel', 'error',
            '-i', 'pipe:0',
            '-vn',
            '-c:a', 'libopus',
            '-b:a', '64k',
            '-ar', '48000',
            '-ac', '1',
            '-f', 'ogg',
            'pipe:1'
        ];
        const ff = spawn(ffmpegPath, args);
        const chunks = [];
        ff.stdout.on('data', c => chunks.push(c));
        ff.on('error', () => resolve(null));
        ff.on('close', code => {
            if (code !== 0 || chunks.length === 0) return resolve(null);
            resolve(Buffer.concat(chunks));
        });
        ff.stdin.on('error', () => {});
        ff.stdin.end(mp3Buffer);
    });
}

// Download audio from URL
async function downloadAudio(url) {
    try {
        const res = await axios.get(url, {
            responseType: 'arraybuffer',
            timeout: 10000,
            headers: { 'User-Agent': 'Mozilla/5.0' }
        });
        
        if (!res.data || res.data.length < 512) return null;
        return Buffer.from(res.data);
    } catch (err) {
        console.error('[audio download]', err.message);
        return null;
    }
}

module.exports = {
    name: 'dictionary',
    alias: ['dict', 'define', 'meaning'],
    desc: 'Get word definitions and phonetics with audio',
    category: 'Search',

    execute: async (context) => {
        const { sock, msg, from, args, reply } = context;
        
        const word = args[0]?.trim().toLowerCase();
        
        if (!word) {
            return reply(
                `╭─❍ *DICTIONARY*\n` +
                `│\n` +
                `│ ⚉ *Usage:* .dictionary <word>\n` +
                `│\n` +
                `│ ✪ *Examples:*\n` +
                `│ .dictionary hello\n` +
                `│ .dictionary love\n` +
                `│ .dictionary serendipity\n` +
                `│\n` +
                `│ 📖 *Free Dictionary API*\n` +
                `╰──────────────────`
            );
        }

        try {
            await sock.sendMessage(from, { react: { text: '📖', key: msg.key } });

            const res = await axios.get(
                `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`,
                {
                    timeout: 10000,
                    headers: { 'Accept': 'application/json' }
                }
            );

            const data = res.data?.[0];
            if (!data) {
                await sock.sendMessage(from, { react: { text: '❔', key: msg.key } });
                return reply(`No definition found for "${word}"`);
            }

            // Extract phonetics
            const phonetics = data.phonetics
                ?.map(p => p.text)
                .filter(Boolean)
                .join(', ') || 'N/A';
            const audioUrl = data.phonetics?.find(p => p.audio)?.audio || '';

            // Get first meaning group
            const meaning = data.meanings?.[0];
            const partOfSpeech = meaning?.partOfSpeech || 'N/A';
            const definition = meaning?.definitions?.[0]?.definition || 'No definition';
            const example = meaning?.definitions?.[0]?.example || 'No example';
            const synonyms = meaning?.synonyms?.slice(0, 5).join(', ') || 'None';
            const antonyms = meaning?.antonyms?.slice(0, 5).join(', ') || 'None';

            // Build formatted response
            let responseText = `╭─❍ *DICTIONARY*\n│\n`;
            responseText += `│ 📖 *Word:* ${data.word}\n`;
            responseText += `│ 🔊 *Phonetic:* ${phonetics}\n`;
            responseText += `│ 📝 *Type:* ${partOfSpeech}\n`;
            responseText += `│\n`;
            responseText += `│ 📚 *Definition:*\n`;
            responseText += `│ ${definition}\n`;
            responseText += `│\n`;
            responseText += `│ 💬 *Example:*\n`;
            responseText += `│ ${example}\n`;
            responseText += `│\n`;
            responseText += `│ 🟢 *Synonyms:*\n`;
            responseText += `│ ${synonyms}\n`;
            responseText += `│\n`;
            responseText += `│ 🔴 *Antonyms:*\n`;
            responseText += `│ ${antonyms}\n`;
            responseText += `│\n`;
            responseText += `╰──────────────────`;

            // Send text definition
            await sock.sendMessage(from, { text: responseText }, { quoted: msg });

            // Download pronunciation and generate TTS for definition and example
            if (audioUrl) {
                try {
                    const pronunciationAudio = await downloadAudio(audioUrl);
                    
                    if (pronunciationAudio && pronunciationAudio.length > 0) {
                        const audioBuffers = [pronunciationAudio];
                        
                        // Generate TTS for definition
                        const definitionTTS = await generateTTS(`Definition: ${definition}`);
                        if (definitionTTS) audioBuffers.push(definitionTTS);
                        
                        // Generate TTS for example
                        const exampleTTS = await generateTTS(`Example: ${example}`);
                        if (exampleTTS) audioBuffers.push(exampleTTS);
                        
                        // Combine all audio
                        let finalAudio = audioBuffers.length > 1 
                            ? await combineAudioBuffers(audioBuffers)
                            : pronunciationAudio;
                        
                        if (!finalAudio) finalAudio = pronunciationAudio;
                        
                        // Try to transcode to OGG/Opus for voice note effect
                        const opus = await transcodeMp3ToOpus(finalAudio);
                        
                        if (opus && opus.length > 0) {
                            // Send as voice note
                            await sock.sendMessage(from, {
                                audio: opus,
                                mimetype: 'audio/ogg; codecs=opus',
                                fileName: `${data.word}_definition.ogg`,
                                ptt: true
                            }, { quoted: msg });
                        } else {
                            // Fallback: send as regular audio file
                            await sock.sendMessage(from, {
                                audio: finalAudio,
                                mimetype: 'audio/mpeg',
                                fileName: `${data.word}_definition.mp3`,
                                ptt: false
                            }, { quoted: msg });
                        }
                    }
                } catch (audioErr) {
                    console.error('[audio composition]', audioErr.message);
                }
            }

            // Success reaction
            await sock.sendMessage(from, { react: { text: '✨', key: msg.key } });

        } catch (error) {
            console.error('[dictionary]', error.message);
            await sock.sendMessage(from, { react: { text: '❔', key: msg.key } });
            reply('Failed to fetch definition');
        }
    }
};
