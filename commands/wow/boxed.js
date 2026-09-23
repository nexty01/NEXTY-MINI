module.exports = {
  name: "boxed",
  aliases: [],
  description: "NEXTY wow utility: boxed",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { return reply('✨ .boxed is ready. Add text or options to explore it.'); } catch (error) { return reply('❌ boxed failed: ' + error.message); }
  }
};
