module.exports = {
    name: 'hexcolor',
    description: 'Validate / describe a hex color. Usage: .hexcolor #ff00aa',
    category: 'general',
    async execute({ args, reply }) {
        const h = (args[0] || '').trim().replace('#','');
        if (!/^[0-9a-fA-F]{3}$|^[0-9a-fA-F]{6}$/.test(h)) return reply('Usage: .hexcolor #RRGGBB');
        const full = h.length === 3 ? h.split('').map(c => c+c).join('') : h;
        const r = parseInt(full.slice(0,2),16), g = parseInt(full.slice(2,4),16), b = parseInt(full.slice(4,6),16);
        const bright = (r*299 + g*587 + b*114)/1000 > 128 ? 'light' : 'dark';
        return reply('🎨 *#' + full.toUpperCase() + '*\n• RGB     : ' + r + ', ' + g + ', ' + b + '\n• Tone    : ' + bright);
    }
};
