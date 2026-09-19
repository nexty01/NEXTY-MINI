/**
 * ListAdmins Command — List all group admins (real numbers, not @lid)
 * Usage: .listadmins
 */
function realJid(p) {
    // Newer Baileys may return participants as @lid. Prefer the
    // resolvable phone number / s.whatsapp.net JID when available.
    if (p.phoneNumber) return p.phoneNumber.includes('@') ? p.phoneNumber : `${p.phoneNumber}@s.whatsapp.net`;
    if (p.jid && p.jid.endsWith('@s.whatsapp.net')) return p.jid;
    if (p.id && p.id.endsWith('@s.whatsapp.net')) return p.id;
    return p.id; // last resort
}

module.exports = {
    name: 'listadmins',
    aliases: ['admins', 'getadmins'],
    description: 'List all admins in the group (real numbers)',
    category: 'admin',
    async execute({ sock, from, reply, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        try {
            const meta = await sock.groupMetadata(from);
            const admins = meta.participants.filter(p => p.admin);
            if (!admins.length) return reply('👑 No admins found in this group.');

            const adminJids = admins.map(realJid);
            const list = admins.map((a, i) => {
                const jid = adminJids[i];
                const num = jid.split('@')[0].split(':')[0];
                const tag = a.admin === 'superadmin' ? '👑' : '⭐';
                return `${i + 1}. @${num} ${tag}`;
            }).join('\n');

            await sock.sendMessage(from, {
                text: `👑 *Group Admins* (${admins.length})\n\n${list}\n\n👑 = Owner  ⭐ = Admin`,
                mentions: adminJids,
            });
        } catch (e) {
            console.error('[listadmins]', e.message);
            reply('❌ Failed to fetch admin list.');
        }
    }
};
