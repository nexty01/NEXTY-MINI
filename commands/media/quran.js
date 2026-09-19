/**
 * Quran Command
 * Usage: .quran <surah:ayah>
 */

const axios = require('axios');

module.exports = {
    name: 'quran',
    description: 'Get an ayah from the Quran',
    category: 'media',
    async execute({ sock, msg, from, reply, args }) {
        const query = args[0];
        if (!query || !query.includes(':')) {
            return reply('📖 Please provide a surah and ayah number.\nExample: .quran 2:255');
        }

        try {
            const res = await axios.get(`https://api.alquran.cloud/v1/ayah/${query}/en.asad`);
            const data = res.data.data;

            const caption = `📖 *Quran Ayah: ${data.surah.englishName} (${data.surah.number}:${data.numberInSurah})*\n\n` +
                `*Arabic:* ${data.text}\n\n` +
                `*Translation:* ${data.text}\n\n` +
                `📜 *Surah:* ${data.surah.name} (${data.surah.englishNameTranslation})`;

            // Note: The above API returns translation if you specify the edition. 
            // Let's get both Arabic and English.
            const resAr = await axios.get(`https://api.alquran.cloud/v1/ayah/${query}`);
            const dataAr = resAr.data.data;

            const finalCaption = `📖 *Quran Ayah: ${data.surah.englishName} (${data.surah.number}:${data.numberInSurah})*\n\n` +
                `*Arabic:*\n${dataAr.text}\n\n` +
                `*English Translation:*\n${data.text}\n\n` +
                `📜 *Surah:* ${data.surah.name} (${data.surah.englishNameTranslation})`;

            reply(finalCaption);
        } catch (err) {
            console.error('[quran]', err.message);
            reply('❌ Ayah not found or API error.');
        }
    }
};
