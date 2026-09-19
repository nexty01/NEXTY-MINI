/**
 * Report Command — Report a member to group admins
 * Usage: Reply to a message + .report <reason>
 *   or:  .report @user <reason>
 *
 * Sends a private DM to all group admins with full report details.
 * Reporter stays anonymous to non-admins.
 */

module.exports = {
    name: 'report',
    aliases: ['reportuser', 'flag'],
    description: 'Report a member to group admins',
    category: 'group',

    async execute({ sock, msg, from, sender, args, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');

        // Resolve reported user — from quoted message or mention
        const quoted      = msg.message?.extendedTextMessage?.contextInfo;
        const quotedSender = quoted?.participant || quoted?.remoteJid || null;
        const mentioned   = quoted?.mentionedJid?.[0] || null;
        const target      = quotedSender || mentioned || null;

        const reason = args.filter(a => !a.startsWith('@')).join(' ').trim()
            || 'No reason provided';

        if (!target) {
            return reply(
                '📢 *Report Member*\n\n' +
                'Reply to a message and type:\n' +
                '`.report <reason>`\n\n' +
                'Or mention a user:\n' +
                '`.report @user <reason>`\n\n' +
                '_Admins will be notified privately._'
            );
        }

        if (target === sender) return reply('❌ You cannot report yourself!');

        // Fetch group metadata to get admin list
        let admins = [];
        try {
            const meta = await sock.groupMetadata(from);
            admins = meta.participants
                .filter(p => p.admin)
                .map(p => p.id);
        } catch (e) {
            return reply('❌ Could not fetch group info. Please try again.');
        }

        if (!admins.length) return reply('❌ No admins found in this group.');

        const now       = new Date().toLocaleString('en-US', { hour: '2-digit', minute: '2-digit', month: 'short', day: 'numeric' });
        const targetNum = target.split('@')[0];
        const senderNum = sender.split('@')[0];

        let groupName = from;
        try {
            const meta = await sock.groupMetadata(from);
            groupName  = meta.subject;
        } catch (_) {}

        const reportMsg =
            '🚨 *New Member Report*\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━\n\n' +
            `📋 Group: *${groupName}*\n` +
            `👤 Reported: *+${targetNum}*\n` +
            `📝 Reason: *${reason}*\n` +
            `🕐 Time: ${now}\n\n` +
            '_Reporter identity is confidential._\n' +
            '━━━━━━━━━━━━━━━━━━━━━━━\n' +
            '_Please review and take action if needed._';

        // DM every admin
        let sent = 0;
        for (const adminJid of admins) {
            try {
                await sock.sendMessage(adminJid, { text: reportMsg });
                sent++;
            } catch (_) {}
        }

        // Confirm to reporter (without revealing admin count)
        reply(
            `✅ *Report Submitted*\n\n` +
            `👤 Reported user: @${targetNum}\n` +
            `📝 Reason: ${reason}\n\n` +
            `_Admins have been notified privately. Thank you for keeping the group safe!_`,
            { mentions: [target] }
        );
    }
};
