'use strict';
/*!
 * NEXTY MINI — Channel auto-engage.
 * On connect: resolves the configured WhatsApp Channel (newsletter) invite
 * link to its real JID, auto-follows it, then listens for new posts on
 * that channel and auto-reacts with a random emoji from REACTION_POOL.
 *
 * Safe to call once per socket — it no-ops if settings.whatsappChannel is
 * empty, and only attaches one 'messages.upsert' listener per socket.
 */

const REACTION_POOL = ['👻', '👀', '🎊', '🌉', '🍬', '🧊', '🍻', '🍺', '🍷'];

function randomReaction() {
    return REACTION_POOL[Math.floor(Math.random() * REACTION_POOL.length)];
}

function extractInviteCode(channelLink) {
    const text = String(channelLink || '').trim();
    const match = text.match(/whatsapp\.com\/channel\/([A-Za-z0-9_-]+)/i);
    return match ? match[1] : (text.includes('@newsletter') ? null : text);
}

/**
 * @param {object} sock       Active Baileys socket (post connection.update === 'open')
 * @param {string} channelLink e.g. settings.whatsappChannel
 * @param {(msg: string) => void} [log] optional logger
 */
async function followAndAutoReactChannel(sock, channelLink, log = console.log) {
    if (!sock || !channelLink) return null;
    if (typeof sock.newsletterMetadata !== 'function') {
        log('[channel-auto-engage] This Baileys build has no newsletter support — skipping.');
        return null;
    }

    const inviteCode = extractInviteCode(channelLink);
    if (!inviteCode) return null;

    let jid = null;
    try {
        const metadata = await sock.newsletterMetadata('invite', inviteCode, 'GUEST');
        jid = metadata?.id || null;
    } catch (error) {
        log(`[channel-auto-engage] Could not resolve channel JID: ${error?.message || error}`);
        return null;
    }
    if (!jid) return null;

    // ── Auto-follow (idempotent — following an already-followed channel is a no-op/soft error) ──
    if (typeof sock.newsletterFollow === 'function') {
        try {
            await sock.newsletterFollow(jid);
            log(`[channel-auto-engage] Auto-followed channel: ${jid}`);
        } catch (error) {
            // Already following, or WhatsApp rate-limited the follow — non-fatal.
            log(`[channel-auto-engage] Follow skipped: ${error?.message || error}`);
        }
    }

    // ── Auto-react to new posts on this channel ──
    if (!sock.__nextyChannelAutoReactAttached && typeof sock.newsletterReactMessage === 'function') {
        sock.__nextyChannelAutoReactAttached = true;
        sock.__nextyWatchedChannelJids = sock.__nextyWatchedChannelJids || new Set();
        sock.__nextyWatchedChannelJids.add(jid);

        sock.ev.on('messages.upsert', async ({ messages, type }) => {
            // NOTE: don't filter by type — channel/newsletter posts have been observed
            // arriving with types other than 'notify' on some Baileys builds.
            for (const m of messages || []) {
                try {
                    const from = m.key?.remoteJid || m.newsletterJid || m.jid;
                    if (!from || !from.endsWith('@newsletter')) continue;
                    if (!sock.__nextyWatchedChannelJids.has(from)) continue;

                    // One-time raw dump so we can see the exact shape this Baileys
                    // build uses for channel posts if the guessed fields below miss.
                    if (!sock.__nextyChannelDebugLogged) {
                        sock.__nextyChannelDebugLogged = true;
                        try {
                            log(`[channel-auto-engage] DEBUG raw newsletter message: ${JSON.stringify(m, (k, v) => (v?.type === 'Buffer' ? '<buffer>' : v), 2).slice(0, 2000)}`);
                        } catch (_) {}
                    }

                    const serverId = m.key?.server_id
                        ?? m.newsletterServerId
                        ?? m.newsletter_server_id
                        ?? m.serverId
                        ?? m.messageStubParameters?.[0]
                        ?? m.key?.serverId
                        ?? m.key?.id;
                    if (serverId == null) {
                        log(`[channel-auto-engage] New post on ${from} but no server-id field found — cannot react. See DEBUG line above.`);
                        continue;
                    }

                    await sock.newsletterReactMessage(from, String(serverId), randomReaction());
                    log(`[channel-auto-engage] Reacted to post ${serverId} on ${from}`);
                } catch (error) {
                    log(`[channel-auto-engage] Auto-react failed: ${error?.message || error}`);
                }
            }
        });
        log(`[channel-auto-engage] Watching for new posts on ${jid} to auto-react.`);
    } else if (typeof sock.newsletterReactMessage !== 'function') {
        log('[channel-auto-engage] This Baileys build has no newsletterReactMessage — auto-react skipped.');
    } else {
        // Listener already attached for this socket — just track the extra JID.
        sock.__nextyWatchedChannelJids = sock.__nextyWatchedChannelJids || new Set();
        sock.__nextyWatchedChannelJids.add(jid);
    }

    return jid;
}

module.exports = { followAndAutoReactChannel, REACTION_POOL, extractInviteCode };
