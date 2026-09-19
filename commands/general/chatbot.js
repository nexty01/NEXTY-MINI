/**
 * Chatbot — AI auto-reply assistant for GROUPS (Hinatu)
 *
 * Mirrors .chatbotdm but for group chats. To avoid spam, it only replies when
 * the bot is mentioned (@bot) OR a user replies to one of the bot's messages.
 *
 * Usage:
 *   .chatbot on                          — enable in this group
 *   .chatbot off                         — disable in this group
 *   .chatbot voice on|off                — toggle voice replies
 *   .chatbot train <persona description> — set a custom persona for THIS group
 *   .chatbot reset                       — reset persona to default
 *   .chatbot status                      — show current state
 */

module.exports = {
    name: 'chatbot',
    aliases: ['groupchatbot', 'gchatbot'],
    description: 'AI auto-reply assistant for groups (only replies when tagged or replied to)',
    usage: '.chatbot on|off|voice on|off|train <persona>|reset|status',
    category: 'general',
    adminOnly: true,

    async execute({ reply, args, database, from, isGroup }) {
        if (!isGroup) return reply('👥 *This command only works inside a group.* Use `.chatbotdm` for DMs.');

        const a0 = (args[0] || '').toLowerCase();
        const a1 = (args[1] || '').toLowerCase();

        const current  = database.getChatbot(from);
        const voiceOn  = database.getChatbotVoice(from);
        const persona  = database.getChatbotPersona(from);

        // ── TRAIN ────────────────────────────────────────────────────────────
        if (a0 === 'train') {
            const personaText = args.slice(1).join(' ').trim();
            if (!personaText) {
                return reply(
                    `🧠 *Train the Group Chatbot*\n\n` +
                    `Current persona: ${persona ? '\n_' + persona + '_' : '(default Hinatu)'}\n\n` +
                    `Usage:\n\`.chatbot train You are a sarcastic football pundit who loves Arsenal.\``
                );
            }
            if (personaText.length > 1000) return reply('❌ Persona too long (max 1000 chars).');
            database.setChatbotPersona(from, personaText);
            return reply(`✅ *Persona updated for this group.*\n\n🧠 _${personaText}_`);
        }

        if (a0 === 'reset') {
            database.setChatbotPersona(from, null);
            return reply('🔄 *Persona reset to default Hinatu.*');
        }

        // ── VOICE ────────────────────────────────────────────────────────────
        if (a0 === 'voice') {
            if (a1 !== 'on' && a1 !== 'off') {
                return reply(
                    `🎙️ *Voice Mode*\n\nStatus: ${voiceOn ? '✅ ON' : '❌ OFF'}\n\n` +
                    `Usage:\n• \`.chatbot voice on\`\n• \`.chatbot voice off\``
                );
            }
            database.setChatbotVoice(from, a1 === 'on');
            return reply(a1 === 'on'
                ? '🎙️ *Voice replies ENABLED.*'
                : '🔇 *Voice replies disabled — text only.*');
        }

        if (a0 === 'status' || !a0) {
            return reply(
                `🤖 *Group Chatbot — Hinatu AI*\n\n` +
                `Status:  ${current ? '✅ ACTIVE' : '❌ OFF'}\n` +
                `Voice:   ${voiceOn ? '🎙️ ON' : '🔇 OFF'}\n` +
                `Persona: ${persona ? '🧠 Custom' : '🌸 Default Hinatu'}\n\n` +
                `*Behavior:* I only reply when you *@tag me* or *reply to my message* — no spam.\n` +
                `*Image-gen:* Ask things like _"generate image of a tiger in space"_ and I'll create it.\n\n` +
                `*Usage:*\n` +
                `• \`.chatbot on\` / \`.chatbot off\`\n` +
                `• \`.chatbot voice on\` / \`.chatbot voice off\`\n` +
                `• \`.chatbot train <how you want me to act>\`\n` +
                `• \`.chatbot reset\``
            );
        }

        if (!['on', 'off'].includes(a0)) {
            return reply('❓ Unknown option. Try `.chatbot status`.');
        }

        if (a0 === 'on' && current)  return reply('🤖 Group chatbot is already *ON*.');
        if (a0 === 'off' && !current) return reply('🤖 Group chatbot is already *OFF*.');

        database.setChatbot(from, a0 === 'on');

        return reply(a0 === 'on'
            ? `✅ *Group Chatbot ENABLED!*\n\n🤖 Hinatu will reply when *tagged* or *replied to*.\nTry: \`.chatbot train\` to customize her personality.`
            : `❌ *Group Chatbot DISABLED.*`);
    }
};
