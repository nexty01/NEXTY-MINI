/**
 * Wordcount Command — Count words, characters and lines in text
 * Usage: .wordcount <text>
 */
module.exports = {
    name: 'wordcount',
    aliases: ['wc', 'charcount'],
    description: 'Count words, characters and lines in text',
    category: 'utility',
    async execute({ reply, args, msg }) {
        let text = args.join(' ');
        if (!text && msg.message?.extendedTextMessage?.contextInfo?.quotedMessage) {
            const q = msg.message.extendedTextMessage.contextInfo.quotedMessage;
            text = q.conversation || q.extendedTextMessage?.text || '';
        }
        if (!text) return reply('📊 *Word Count*\n\nUsage: .wordcount <text>\nOr reply to a message with .wordcount');
        const words = text.trim().split(/\s+/).filter(w => w.length > 0).length;
        const chars = text.length;
        const charsNoSpace = text.replace(/\s/g, '').length;
        const lines = text.split('\n').length;
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0).length;
        reply(`📊 *Text Analysis*\n\n📝 Words: *${words}*\n🔤 Characters: *${chars}*\n🔡 Chars (no spaces): *${charsNoSpace}*\n📄 Lines: *${lines}*\n💬 Sentences: *${sentences}*`);
    }
};
