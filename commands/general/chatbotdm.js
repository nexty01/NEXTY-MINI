/**
 * Chatbot DM — AI auto-reply assistant for private DMs
 * When enabled, the AI replies to anyone who messages the bot's number privately.
 * Only works in DMs, never in groups.
 * Usage: .chatbotdm on | .chatbotdm off
 */

module.exports = {
    name: 'chatbotdm',
    aliases: ['dmbot', 'aiassistant'],
    description: 'AI auto-reply assistant for private DMs',
    usage: '.chatbotdm on/off',
    category: 'owner',

    async execute({ reply, args, database, phoneNumber, isGroup }) {
        if (isGroup) return reply('💬 This command only works in a private DM, not in groups!');

        const a0 = (args[0] || '').toLowerCase();
        const a1 = (args[1] || '').toLowerCase();

        // ── Voice sub-mode: .chatbotdm voice on|off ───────────────────────
        if (a0 === 'voice') {
            if (a1 !== 'on' && a1 !== 'off') {
                const v = database.getChatbotDMVoice(phoneNumber);
                return reply(
                    `🎙️ *Hinatu Voice Mode*\n\n` +
                    `Status: ${v ? '✅ ON' : '❌ OFF'}\n\n` +
                    `*Usage:*\n` +
                    `• \`.chatbotdm voice on\`  — reply with female voice (Hinatu)\n` +
                    `• \`.chatbotdm voice off\` — reply with text only`
                );
            }
            database.setChatbotDMVoice(phoneNumber, a1 === 'on');
            return reply(
                a1 === 'on'
                    ? `🎙️ *Hinatu voice mode ENABLED.*\n\nI will now reply with a soft female voice.\n_(Make sure .chatbotdm is also ON.)_`
                    : `🔇 *Hinatu voice mode DISABLED.*\n\nReplies will be sent as text again.`
            );
        }

        const action = a0;
        const current = database.getChatbotDM(phoneNumber);

        if (!action || !['on', 'off'].includes(action)) {
            return reply(
                `🤖 *Chatbot DM — Hinatu AI Assistant*\n\n` +
                `Status: ${current ? '✅ ACTIVE' : '❌ OFF'}\n` +
                `Voice: ${database.getChatbotDMVoice(phoneNumber) ? '🎙️ ON (Hinatu)' : '🔇 OFF'}\n\n` +
                `*Usage:*\n` +
                `• \`.chatbotdm on\`  — Enable AI auto-reply\n` +
                `• \`.chatbotdm off\` — Disable AI auto-reply\n` +
                `• \`.chatbotdm voice on\`  — reply with Hinatu's voice\n` +
                `• \`.chatbotdm voice off\` — reply with text\n\n` +
                `_Hinatu only responds in DMs — never in group chats._`
            );
        }

        if (action === 'on' && current) return reply('🤖 Chatbot DM is already *ON*!');
        if (action === 'off' && !current) return reply('🤖 Chatbot DM is already *OFF*!');

        database.setChatbotDM(phoneNumber, action === 'on');

        if (action === 'on') {
            return reply(
                `✅ *Chatbot DM ENABLED!*\n\n` +
                `🤖 *Hinatu* will now automatically reply to anyone who DMs this number.\n\n` +
                `Use \`.chatbotdm voice on\` to make her reply with voice messages.\n` +
                `Type \`.chatbotdm off\` to disable.`
            );
        } else {
            return reply(`❌ *Chatbot DM DISABLED!*\n\n_Hinatu will no longer auto-reply to private messages._`);
        }
    }
};
