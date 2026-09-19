/**
 * .confirmkick — execute the pending .kickall request.
 * Must be sent by the same admin within 60s of .kickall.
 */
const pendingKicks = require('../../utils/pendingKicks');

async function removeInBatches(sock, from, ids, batchSize = 50) {
    let removed = 0;
    const failed = [];
    for (let i = 0; i < ids.length; i += batchSize) {
        const chunk = ids.slice(i, i + batchSize);
        try {
            await sock.groupParticipantsUpdate(from, chunk, 'remove');
            removed += chunk.length;
        } catch (err) {
            failed.push({ chunk, error: err.message });
        }
    }
    return { removed, failed };
}

module.exports = {
    name: 'confirmkick',
    description: 'Confirm and execute a pending .kickall',
    category: 'admin',

    async execute({ sock, reply, from, sender, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('🔒 Admins only.');

        const pending = pendingKicks.get(from);
        if (!pending) {
            return reply('❌ No pending .kickall to confirm (or it expired). Run *.kickall* first.');
        }
        if (pending.adminJid !== sender) {
            return reply('❌ Only the admin who issued *.kickall* can confirm it.');
        }

        try {
            const meta = await sock.groupMetadata(from);
            const botJid = (sock.user?.id || '').split(':')[0] + '@s.whatsapp.net';
            const targets = meta.participants
                .filter(p => !p.admin)
                .map(p => p.id)
                .filter(id => id !== sender && id !== botJid);

            pendingKicks.clear(from);

            if (targets.length === 0) return reply('✅ Nothing to remove.');

            await reply(`🚪 Removing *${targets.length}* members...`);

            const { removed, failed } = await removeInBatches(sock, from, targets);

            let summary = `✅ *Mass kick complete.*\n\nRemoved: *${removed}* / ${targets.length}`;
            if (failed.length) {
                summary += `\nFailed batches: ${failed.length}`;
                summary += `\nFirst error: ${failed[0].error}`;
            }
            await reply(summary);
        } catch (err) {
            reply(`❌ Failed: ${err.message}`);
        }
    }
};
