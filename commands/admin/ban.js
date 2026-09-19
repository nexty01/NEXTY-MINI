/**
 * Ban Command — Flag a user so the bot silently ignores their commands
 * Usage:
 *   .ban @user            (tag a user)
 *   .ban                  (reply to a user's message)
 *   .ban 2348012345678    (raw number)
 *   .ban list             (show banned numbers)
 *   .ban remove @user     (unban)
 */

const database = require('../../utils/database');

function extractTarget(msg, args) {
    // 1) Mentions
    const ctx = msg?.message?.extendedTextMessage?.contextInfo;
    const mentioned = ctx?.mentionedJid?.[0];
    if (mentioned) return mentioned.split('@')[0].replace(/\D/g, '');

    // 2) Quoted reply
    const quotedParticipant = ctx?.participant;
    if (quotedParticipant) return quotedParticipant.split('@')[0].split(':')[0].replace(/\D/g, '');

    // 3) Raw number argument
    if (args[0]) {
        const num = args[0].replace(/\D/g, '');
        if (num.length >= 6) return num;
    }
    return null;
}

module.exports = {
    name: 'ban',
    aliases: ['blockuser', 'banuser'],
    description: 'Ban a user from using bot commands (silent ignore in public mode)',
    category: 'admin',
    async execute({ reply, msg, args, isOwner }) {
        try {
            if (!isOwner) {
                return reply('🛡️ *Owner Only!*\n\n❌ Only the bot owner can ban users.');
            }

            const sub = (args[0] || '').toLowerCase();

            // ── LIST ─────────────────────────────────────────────────────
            if (sub === 'list' || sub === 'show') {
                const all = Object.keys(database.data.banned || {})
                    .filter(k => database.data.banned[k]);
                if (!all.length) {
                    return reply('📋 *Ban List*\n\n_No users are currently banned._');
                }
                const lines = all.map((n, i) => `${i + 1}. +${n}`).join('\n');
                return reply(`📋 *Banned Users (${all.length})*\n\n${lines}\n\nUse *.ban remove <number>* to unban.`);
            }

            // ── REMOVE / UNBAN ───────────────────────────────────────────
            if (sub === 'remove' || sub === 'unban' || sub === 'off') {
                const target = extractTarget(msg, args.slice(1));
                if (!target) {
                    return reply('❌ *Usage:* `.ban remove @user` or `.ban remove 234...`');
                }
                if (!database.isBanned(target)) {
                    return reply(`ℹ️ *+${target}* is not banned.`);
                }
                database.setBanned(target, false);
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  ✅ *USER UNBANNED*       ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `🔓 *+${target}* can now use the bot again.`
                );
            }

            // ── BAN ──────────────────────────────────────────────────────
            const target = extractTarget(msg, args);
            if (!target) {
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  🚫 *BAN COMMAND*         ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `*Usage:*\n` +
                    `▸ .ban @user — tag a user\n` +
                    `▸ .ban (reply to message)\n` +
                    `▸ .ban 2348012345678\n` +
                    `▸ .ban list — view banned users\n` +
                    `▸ .ban remove @user — unban\n\n` +
                    `_Banned users are silently ignored when the bot is public._`
                );
            }

            if (database.isBanned(target)) {
                return reply(`⚠️ *+${target}* is already banned.`);
            }

            database.setBanned(target, true);
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🚫 *USER BANNED*         ║\n` +
                `╚══════════════════════════╝\n\n` +
                `🔒 *+${target}* has been *banned*.\n\n` +
                `┌─────────────────────────┐\n` +
                `│ 🟢 Status:  *ACTIVE*\n` +
                `│ 🤫 Mode:    *SILENT IGNORE*\n` +
                `└─────────────────────────┘\n\n` +
                `_All bot commands from this user will be silently ignored._\n\n` +
                `Use *.ban remove @user* to unban.`,
                { mentions: [`${target}@s.whatsapp.net`] }
            );
        } catch (err) {
            console.error('[BAN]', err);
            return reply(`❌ Error: ${err.message}`);
        }
    }
};
