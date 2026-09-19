/**
 * creategc — Create a new WhatsApp group and send its invite link.
 *
 * Usage:
 *   .creategc                                       (auto-named group)
 *   .creategc <group name>
 *   .creategc <group name> | 2547xxxxxxx,2348xxxxxxx
 *
 * Nothing is mandatory — .creategc alone works.
 *
 * IMPORTANT: the bot's own JID must NOT be in the `participants` array
 * passed to sock.groupCreate() — you're the creator, WhatsApp adds you
 * implicitly, and passing your own JID again is what was throwing
 * "Failed to create the group" for every caller regardless of role,
 * since the runner's JID was always being added to that list. Fixed by
 * excluding it. Solo creation (empty participants) is valid on WhatsApp —
 * you just end up as the only member until you share the invite link.
 *
 * Owner-gated: this spins up a real group under the bot's own WhatsApp
 * account, same precaution as .joingc.
 */

'use strict';

function normNumber(jid) {
    return (jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function defaultGroupName() {
    const stamp = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    return `New Group · ${stamp}`;
}

module.exports = {
    name: 'creategc',
    aliases: ['creategroup', 'newgc', 'mkgroup'],
    description: 'Create a WhatsApp group and get its invite link',
    category: 'owner',
    ownerOnly: true,

    execute: async (context) => {
        const { sock, msg, args, sender, reply } = context;

        try {
            const raw = args.join(' ').trim();

            const [namePart, numsPart] = raw ? raw.split('|').map(s => s?.trim()) : ['', ''];
            const groupName = namePart || defaultGroupName();

            // Bot's own number — never goes into participants (implicit creator).
            const botNumber = normNumber(sock.user?.id);

            // Build participant list: extra numbers only, minus the bot itself.
            const extraNumbers = numsPart
                ? numsPart.split(/[,\s]+/).map(n => n.replace(/[^0-9]/g, '')).filter(Boolean)
                : [];

            const participantSet = new Set();
            for (const num of extraNumbers) {
                if (num === botNumber) continue;
                participantSet.add(`${num}@s.whatsapp.net`);
            }
            // If the runner isn't the bot's own number, add them too —
            // otherwise they're already the creator and shouldn't be listed.
            const senderNumber = normNumber(sender);
            if (senderNumber && senderNumber !== botNumber) {
                participantSet.add(`${senderNumber}@s.whatsapp.net`);
            }
            const participants = [...participantSet];

            await reply('⏳ Creating group...');

            let group;
            try {
                group = await sock.groupCreate(groupName, participants);
            } catch (err) {
                console.error('[creategc]', err?.stack || err?.message || err);
                const detail = err?.message || err?.toString?.() || 'Unknown error';
                return reply(`❌ Failed to create the group.\n\n_Reason:_ ${detail}`);
            }

            if (!group?.id) {
                return reply('❌ Group creation returned no ID — try again.');
            }

            let inviteCode = group.inviteCode;
            if (!inviteCode) {
                try {
                    inviteCode = await sock.groupInviteCode(group.id);
                } catch (err) {
                    console.error('[creategc invite]', err?.message || err);
                }
            }

            if (!inviteCode) {
                return reply(
                    `✅ *Group created!*\n\n` +
                    `📛 Name: ${groupName}\n` +
                    `🆔 ID: ${group.id}\n\n` +
                    `⚠️ Couldn't fetch the invite link — try .link inside the group.`
                );
            }

            const inviteUrl = `https://chat.whatsapp.com/${inviteCode}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text:
                    `╔══════════════════════════╗\n` +
                    `║   🆕 *GROUP CREATED*       ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `┌─────────────────────────\n` +
                    `│ 📛 *Name:* ${groupName}\n` +
                    `│ 👥 *Members:* ${participants.length + 1} _(incl. you)_\n` +
                    `└─────────────────────────\n\n` +
                    `🔗 ${inviteUrl}\n\n` +
                    `> Tap the link above to open the group.`,
                richPreview:        true,
                previewTitle:       groupName,
                previewDescription: `${participants.length + 1} members · Tap to join`,
            }, { quoted: msg });

        } catch (err) {
            console.error('[creategc]', err?.message || err);
            reply('❌ Failed to create group.');
        }
    }
};
