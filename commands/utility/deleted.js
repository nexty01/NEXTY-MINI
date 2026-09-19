/**
 * .deleted — recover deleted message(s) from THIS chat only.
 *
 * Difference from .retrieve: .retrieve is the owner-only global vault that
 * dumps every deleted message from every chat the bot is in. .deleted is
 * scoped to the chat it's run in — it only ever shows what was deleted
 * right here (this group or this DM), filtered by the chat's own JID.
 *
 * This reuses the SAME silent capture vault that already powers .retrieve
 * (see utils/retrieveStore.js + the messages.upsert handler in
 * lib/sessionManager.js) — deletions are already captured with the chat
 * JID attached and media already downloaded at capture time, so this
 * command doesn't need to re-download anything or maintain its own store.
 *
 * Usage:
 *   .deleted            — recover the most recently deleted message here
 *   .deleted <number>   — recover the Nth most recent deleted message here
 *   .deleted all        — send every stored deleted message from this chat
 *   .deleted info       — stats for this chat only
 *
 * Open to anyone in the chat by default — it only ever surfaces messages
 * deleted in that same chat, never cross-chat like .retrieve. Set
 * OWNER_ONLY to true below if you'd rather lock it down.
 */
'use strict';

const { getAll } = require('../../utils/retrieveStore');

const OWNER_ONLY = false;

module.exports = {
    name: 'deleted',
    aliases: ['chatdeleted', 'delmsg'],
    description: 'Recover deleted message(s) from this chat',
    usage: '.deleted [<number> | all | info]',
    category: 'utility',

    async execute({ sock, from, msg, args, reply, phoneNumber, isOwner }) {
        if (OWNER_ONLY && !isOwner) return reply('🔒 _Owner only command._');

        await sock.sendMessage(from, { react: { text: '🗑️', key: msg.key } });

        try {
            // Scoped to THIS chat's jid only — the key difference vs .retrieve
            const entries = getAll(phoneNumber, from);
            const sub = (args[0] || '').toLowerCase().trim();

            if (!entries.length) {
                await sock.sendMessage(from, { react: { text: '📡', key: msg.key } });
                return reply('⊘ *No deleted messages found in this chat.*');
            }

            if (sub === 'info') {
                const types = _typeBreakdown(entries);
                await sock.sendMessage(from, { react: { text: '💬', key: msg.key } });
                return reply(
                    `🗑️ *Deleted Messages — This Chat*\n\n` +
                    `📦 Stored: *${entries.length}*\n\n` +
                    `📊 *By type:*\n${types}\n\n` +
                    `⏱️ Entries expire after 2 hours.\n` +
                    `Use *.deleted* for the last one, *.deleted all* for everything.`
                );
            }

            if (sub === 'all') {
                await reply(
                    `🗑️ *${entries.length}* deleted message${entries.length !== 1 ? 's' : ''} in this chat\n` +
                    `> Sending now — newest first…`
                );
                for (let i = 0; i < entries.length; i++) {
                    await _sendEntry(sock, from, msg, entries[i], i + 1, entries.length);
                    if (entries.length > 1) await _sleep(700);
                }
                await sock.sendMessage(from, { react: { text: '💬', key: msg.key } });
                return;
            }

            // Single entry — default (last one) or by index
            let idx = 0; // newest first, so index 0 = most recent
            if (sub && !isNaN(parseInt(sub, 10))) {
                idx = parseInt(sub, 10) - 1;
                if (idx < 0 || idx >= entries.length) {
                    await sock.sendMessage(from, { react: { text: '📡', key: msg.key } });
                    return reply(`❌ No entry #${sub}. This chat has *${entries.length}* stored (use 1–${entries.length}).`);
                }
            }

            await _sendEntry(sock, from, msg, entries[idx], idx + 1, entries.length);
            await sock.sendMessage(from, { react: { text: '💬', key: msg.key } });

        } catch (error) {
            console.error('[DELETED ERROR]', error);
            await sock.sendMessage(from, { react: { text: '❔', key: msg.key } });
            reply(`⊘ *Error:* ${error.message}`);
        }
    },
};

// ── Helpers ───────────────────────────────────────────────────────

async function _sendEntry(sock, chatJid, msg, entry, idx, total) {
    const selfDeleted = entry.senderNum === entry.deleterNum;
    const header =
        `🗑️ *[${idx}/${total}]* — ${_timeAgo(entry.deletedAt)}\n` +
        `✉️  *From:*      ${entry.senderNum || 'Unknown'}\n` +
        `🚮 *Deleted by:* ${selfDeleted ? '(themselves)' : (entry.deleterNum || 'Unknown')}\n` +
        `📎 *Type:*      ${entry.type}`;

    const opts = { quoted: msg };

    try {
        if (entry.type === 'text') {
            await sock.sendMessage(chatJid, { text: `${header}\n\n💬 *Message:*\n${entry.body}` }, opts);
            return;
        }

        if (entry.mediaBuffer && entry.mediaBuffer.length > 500) {
            const cap = header + (entry.caption ? `\n\n📝 *Caption:* ${entry.caption}` : '');

            if (entry.type === 'image') {
                await sock.sendMessage(chatJid, { image: entry.mediaBuffer, caption: cap }, opts);
            } else if (entry.type === 'video') {
                await sock.sendMessage(chatJid, { video: entry.mediaBuffer, caption: cap }, opts);
            } else if (entry.type === 'sticker') {
                await sock.sendMessage(chatJid, { sticker: entry.mediaBuffer }, opts);
                await sock.sendMessage(chatJid, { text: header });
            } else if (entry.type === 'audio') {
                await sock.sendMessage(chatJid, {
                    audio: entry.mediaBuffer,
                    mimetype: entry.mimetype || 'audio/ogg; codecs=opus',
                    ptt: !!entry.ptt,
                }, opts);
                await sock.sendMessage(chatJid, { text: header });
            } else if (entry.type === 'document') {
                await sock.sendMessage(chatJid, {
                    document: entry.mediaBuffer,
                    mimetype: entry.mimetype || 'application/octet-stream',
                    fileName: entry.fileName || 'recovered_file',
                    caption: cap,
                }, opts);
            }
            return;
        }

        // Media entry but buffer missing/expired
        await sock.sendMessage(chatJid, {
            text: `${header}\n\n⚠️ _(Media unavailable — may have expired on WhatsApp servers)_`,
        }, opts);

    } catch (err) {
        console.error('[DELETED] send error idx=' + idx, err.message);
        try {
            await sock.sendMessage(chatJid, { text: `${header}\n\n❌ _(Error delivering this entry)_` }, opts);
        } catch (_) {}
    }
}

function _typeBreakdown(entries) {
    const counts = {};
    for (const e of entries) counts[e.type] = (counts[e.type] || 0) + 1;
    return Object.entries(counts).map(([t, n]) => `  • ${t}: ${n}`).join('\n');
}

function _timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return `${h}h ${m}m ago`;
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
