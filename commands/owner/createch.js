/**
 * createch — Create a new WhatsApp Channel (newsletter) and send its link.
 *
 * Usage:
 *   .createch <channel name>
 *   .createch <channel name> | <description>
 *
 * LINK FIX: the previous version built the link from the channel's raw
 * numeric JID (channel.id, e.g. "120363...@newsletter"). That numeric
 * string is only the internal ID — it is NOT what resolves at
 * whatsapp.com/channel/. The real shareable link uses a separate invite
 * code (looks like "0029Vb..."), the same way group links use
 * groupInviteCode rather than the group's raw JID. We now read that
 * code off the object newsletterCreate() returns (checking every field
 * name seen across Baileys forks), and if it's genuinely not present on
 * creation, fetch it explicitly via newsletterMetadata() before ever
 * showing a link — so we never present a link we haven't verified.
 *
 * Owner-gated: this spins up a real channel under the bot's own WhatsApp
 * account, same precaution as .creategc / .joingc.
 */

'use strict';

// Different Baileys forks have named this field differently over time.
// Check every known variant, including one level of nesting.
function extractInviteCode(obj) {
    if (!obj) return null;
    const candidates = [
        obj.invite, obj.inviteCode, obj.invite_code,
        obj.inviteLink, obj.invite_link,
        obj.metadata?.invite, obj.metadata?.inviteCode,
    ];
    for (const c of candidates) {
        if (typeof c === 'string' && c.length > 5 && !c.includes('@')) return c;
    }
    return null;
}

module.exports = {
    name: 'createch',
    aliases: ['createchannel', 'newch', 'mkchannel'],
    description: 'Create a WhatsApp Channel and get its link',
    category: 'owner',
    ownerOnly: true,

    execute: async (context) => {
        const { sock, msg, args, reply } = context;

        try {
            const raw = args.join(' ').trim();
            if (!raw) {
                return reply(
                    `🆕 *CREATE CHANNEL*\n\n` +
                    `Usage:\n` +
                    `.createch <channel name>\n` +
                    `.createch <channel name> | <description>`
                );
            }

            const [namePart, descPart] = raw.split('|').map(s => s?.trim());
            const channelName = namePart || 'New Channel';
            const description = descPart || 'Official channel';

            if (!channelName || channelName.length < 1) {
                return reply('❌ Give the channel a name.');
            }

            await reply('⏳ Creating channel...');

            let channel;
            try {
                channel = await sock.newsletterCreate(channelName, description);
            } catch (err) {
                console.error('[createch]', err?.stack || err?.message || err);
                const detail = err?.message || err?.toString?.() || 'Unknown error';
                return reply(`❌ Failed to create the channel.\n\n_Reason:_ ${detail}`);
            }

            if (!channel?.id) {
                return reply('❌ Channel creation returned no ID — try again.');
            }

            // Try to read the invite code straight off the create response.
            let inviteCode = extractInviteCode(channel);

            // Not every fork returns it inline — fetch it explicitly if missing.
            if (!inviteCode) {
                try {
                    const fresh = await sock.newsletterMetadata('jid', channel.id);
                    inviteCode = extractInviteCode(fresh);
                } catch (err) {
                    console.error('[createch metadata]', err?.message || err);
                }
            }

            if (!inviteCode) {
                console.error('[createch] no invite code found on:', JSON.stringify(channel));
                return reply(
                    `✅ *Channel created!*\n\n` +
                    `📛 Name: ${channelName}\n` +
                    `🆔 ID: ${channel.id}\n\n` +
                    `⚠️ Couldn't confirm the invite link from WhatsApp's response — ` +
                    `check the channel's own Invite Link option in-app rather than ` +
                    `trusting a guessed URL.`
                );
            }

            const channelUrl = `https://whatsapp.com/channel/${inviteCode}`;

            await sock.sendMessage(msg.key.remoteJid, {
                text:
                    `╔══════════════════════════╗\n` +
                    `║   🆕 *CHANNEL CREATED*     ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `┌─────────────────────────\n` +
                    `│ 📛 *Name:* ${channelName}\n` +
                    `│ 📝 *About:* ${description}\n` +
                    `└─────────────────────────\n\n` +
                    `🔗 ${channelUrl}\n\n` +
                    `> Tap the link above to open the channel.`,
                richPreview:        true,
                previewTitle:       channelName,
                previewDescription: description,
            }, { quoted: msg });

        } catch (err) {
            console.error('[createch]', err?.message || err);
            reply('❌ Failed to create channel.');
        }
    }
};

