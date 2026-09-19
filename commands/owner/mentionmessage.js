/**
 * MentionMessage — Owner & Mod command
 * Owner: .mentionmessage set I'm busy  → bot replies when OWNER is tagged
 * Mod:   .mentionmessage set I'm busy  → bot replies when THAT MOD is tagged
 *
 * Usage:
 *   .mentionmessage set <text>  — enable with message
 *   .mentionmessage off         — disable
 *   .mentionmessage clear       — clear saved message
 *   .mentionmessage status      — show setting
 */

const database = require('../../utils/database');

module.exports = {
    name: 'mentionmessage',
    aliases: ['mmessage', 'mentionmsg', 'mmsg', 'mentionreply'],
    description: 'Auto-reply when someone mentions you in a group',
    category: 'owner',

    async execute({ reply, args, phoneNumber, sender, isOwner, isMod }) {
        if (!isOwner && !isMod) return reply('❌ Owner or Mod only!');

        // userPhone = actual phone of whoever runs this command (owner or mod)
        const userPhone = sender.split('@')[0].split(':')[0].replace(/\D/g, '');
        const action = (args[0] || '').toLowerCase();
        const current = database.getMentionMessage(phoneNumber, userPhone);

        if (!action || action === 'status') {
            return reply(
                `╔══════════════════════════╗\n` +
                `║  💬 *MENTION MESSAGE*     ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Status: ${current?.enabled ? '✅ ON' : '❌ OFF'}\n` +
                `Message: ${current?.message ? `_"${current.message}"_` : '_(not set)_'}\n\n` +
                `*Usage:*\n` +
                `▸ .mentionmessage set <text>\n` +
                `▸ .mentionmessage off\n` +
                `▸ .mentionmessage clear\n` +
                `▸ .mentionmessage status\n\n` +
                `_Whenever someone tags you in a group, the bot replies with your set message._`
            );
        }

        if (action === 'off' || action === 'disable') {
            database.setMentionMessage(phoneNumber, { enabled: false, message: current?.message || '' }, userPhone);
            return reply('❌ *Mention Message DISABLED*');
        }

        if (action === 'clear') {
            database.setMentionMessage(phoneNumber, { enabled: false, message: '' }, userPhone);
            return reply('🗑️ *Mention Message CLEARED*');
        }

        if (action === 'set' || action === 'on') {
            const message = args.slice(1).join(' ').trim();
            if (!message) return reply('❌ Provide a message!\n\nExample: `.mentionmessage set I\'m busy!`');
            database.setMentionMessage(phoneNumber, { enabled: true, message }, userPhone);
            return reply(`✅ *Mention Message ENABLED*\n\nMessage: _"${message}"_`);
        }

        return reply('❓ Usage: `.mentionmessage set <your message>` | `.mentionmessage off`');
    },

    /**
     * handleMentionMessageTag — called once per group message from
     * sessionManager.js, once for the owner and once per mod. Mirrors
     * dnd.js's handleDndTag but never deletes the tagging message.
     *
     * ctx fields (LID-resolved by sessionManager):
     *   phoneNumber     — session's own number (DB key)
     *   targetPhone     — bare digits of the owner/mod being checked
     *   senderPhone     — bare digits of whoever sent this message
     *   mentionedPhones — Set of bare digits explicitly @-tagged
     *   quotedPhone     — bare digits of person being replied/quoted (or '')
     */
    async handleMentionMessageTag(sock, msg, from, ctx) {
        try {
            const { phoneNumber, targetPhone, senderPhone, mentionedPhones, quotedPhone, sender } = ctx;

            if (senderPhone === targetPhone) return; // never trigger on yourself

            const tagged = mentionedPhones.has(targetPhone) || quotedPhone === targetPhone;
            if (!tagged) return;

            const mMsg = database.getMentionMessage(phoneNumber, targetPhone);
            if (!mMsg?.enabled || !mMsg.message) return;

            await sock.sendMessage(from, {
                text: mMsg.message,
                mentions: [sender],
            }, { quoted: msg }).catch(() => {});
        } catch (err) {
            console.error('[MENTIONMESSAGE]', err.message);
        }
    },
};
