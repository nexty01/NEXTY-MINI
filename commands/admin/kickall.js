/**
 * .kickall — ask for confirmation before mass-removing all non-admins.
 * Confirmation handled by .confirmkick within 60 seconds.
 */
const pendingKicks = require('../../utils/pendingKicks');

module.exports = {
    name: 'kickall',
    description: 'Remove all non-admin members (requires .confirmkick within 60s)',
    category: 'admin',

    async execute({ sock, msg, reply, from, sender, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('🔒 Admins only.');

        try {
            const meta = await sock.groupMetadata(from);
            const nonAdmins = meta.participants.filter(p => !p.admin);
            const count = nonAdmins.length;

            if (count === 0) return reply('✅ No non-admin members to remove.');

            pendingKicks.set(from, sender);

            await reply(
                `⚠️ *Confirm Mass Kick*\n\n` +
                `This will remove *${count}* non-admin member${count === 1 ? '' : 's'} from this group.\n\n` +
                `Reply with *.confirmkick* within *60 seconds* to proceed.\n` +
                `Ignore this message to cancel.`
            );
        } catch (err) {
            reply(`❌ Failed: ${err.message}`);
        }
    }
};
