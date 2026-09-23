module.exports = {
  name: "vcard",
  aliases: [],
  description: "NEXTY wow utility: vcard",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { const name = args.join(' ') || 'NEXTY User'; return reply('BEGIN:VCARD\nVERSION:3.0\nFN:' + name.replace(/[\r\n]/g, ' ') + '\nTEL;type=CELL:+0000000000\nEND:VCARD'); } catch (error) { return reply('❌ vcard failed: ' + error.message); }
  }
};
