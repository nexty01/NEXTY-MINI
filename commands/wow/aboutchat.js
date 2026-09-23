module.exports = {
  name: "aboutchat",
  aliases: [],
  description: "NEXTY wow utility: aboutchat",
  async execute({ reply, args = [], from, sender, msg, isGroup }) {
    try { return reply('📊 Chat type: '+(isGroup?'Group':'Private')+'\nChat ID: '+from+'\nBot: NEXTY MINI'); } catch (error) { return reply('❌ aboutchat failed: ' + error.message); }
  }
};
