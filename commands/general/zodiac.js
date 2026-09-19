module.exports = {
    name: 'zodiac',
    description: 'Western zodiac sign. Usage: .zodiac MM-DD',
    category: 'general',
    async execute({ args, reply }) {
        const m = (args[0]||'').match(/^(\d{1,2})[-/](\d{1,2})$/);
        if (!m) return reply('Usage: .zodiac MM-DD (e.g. .zodiac 06-15)');
        const mo = +m[1], d = +m[2];
        const SIGNS = [
            ['Capricorn',  '♑', 1, 19],['Aquarius',   '♒', 2, 18],['Pisces',     '♓', 3, 20],
            ['Aries',      '♈', 4, 19],['Taurus',     '♉', 5, 20],['Gemini',     '♊', 6, 20],
            ['Cancer',     '♋', 7, 22],['Leo',        '♌', 8, 22],['Virgo',      '♍', 9, 22],
            ['Libra',      '♎', 10,22],['Scorpio',    '♏', 11,21],['Sagittarius','♐', 12,21],['Capricorn','♑',12,31],
        ];
        let sign = SIGNS[SIGNS.length-1];
        for (const s of SIGNS) if (mo < s[2] || (mo === s[2] && d <= s[3])) { sign = s; break; }
        return reply('🔮 *Zodiac*\nDate: ' + mo + '-' + d + '\nSign: ' + sign[1] + ' *' + sign[0] + '*');
    }
};
