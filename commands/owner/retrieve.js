/**
 * .retrieve — access the silent deleted-message vault
 *
 * The bot silently captures every deleted message (text, image, video,
 * sticker, audio, document) from ALL chats for 2 hours.  Only the owner
 * can retrieve them.
 *
 * Usage:
 *   .retrieve              — list summary + send all stored entries
 *   .retrieve <number>     — send one specific entry (1-based)
 *   .retrieve group        — only entries from groups
 *   .retrieve dm           — only entries from DMs
 *   .retrieve clear        — wipe the vault
 *   .retrieve info         — show vault stats without sending
 */
'use strict';

const { getAll, count, clear } = require('../../utils/retrieveStore');

module.exports = {
    name:        'retrieve',
    aliases:     ['rd', 'getdeleted', 'vault'],
    description: 'Retrieve silently stored deleted messages (owner only)',
    usage:       '.retrieve [<number> | group | dm | clear | info]',
    category:    'owner',

    async execute({ sock, from, msg, args, reply, phoneNumber, isOwner }) {
        if (!isOwner) return reply('🔒 _Owner only command._');

        const sub = (args[0] || '').toLowerCase().trim();

        // ── CLEAR ────────────────────────────────────────────────────────
        if (sub === 'clear') {
            const was = count(phoneNumber);
            clear(phoneNumber);
            return reply(
                `🗑️ *Vault cleared.*\n\n` +
                `Removed *${was}* stored entr${was !== 1 ? 'ies' : 'y'}.`
            );
        }

        // ── INFO ─────────────────────────────────────────────────────────
        const all = getAll(phoneNumber);
        if (sub === 'info') {
            if (!all.length) return reply('📭 *Vault is empty.* Nothing deleted recently.');
            const groups = all.filter(e => e.jid?.endsWith('@g.us')).length;
            const dms    = all.length - groups;
            const types  = _typeBreakdown(all);
            return reply(
                `🗂️ *Retrieve Vault — Stats*\n\n` +
                `📦 Total stored : *${all.length}*\n` +
                `👥 From groups  : *${groups}*\n` +
                `💬 From DMs     : *${dms}*\n\n` +
                `📊 *By type:*\n${types}\n\n` +
                `⏱️ Entries expire after *2 hours.*\n` +
                `Use *.retrieve* to send all, *.retrieve clear* to wipe.`
            );
        }

        if (!all.length) {
            return reply(
                `📭 *Vault is empty.*\n\n` +
                `The bot silently captures every deleted message from all\n` +
                `chats (groups + DMs) without announcing anything.\n\n` +
                `Entries are stored for *2 hours* then auto-cleared.\n` +
                `Only you can see them here.`
            );
        }

        // ── FILTER by type ────────────────────────────────────────────────
        let filtered = all;
        if (sub === 'group') {
            filtered = all.filter(e => e.jid?.endsWith('@g.us'));
            if (!filtered.length) return reply('📭 No deleted messages from groups stored.');
        } else if (sub === 'dm') {
            filtered = all.filter(e => !e.jid?.endsWith('@g.us'));
            if (!filtered.length) return reply('📭 No deleted messages from DMs stored.');
        }

        // ── SINGLE ENTRY ──────────────────────────────────────────────────
        if (sub && !isNaN(parseInt(sub, 10))) {
            const idx = parseInt(sub, 10) - 1;
            if (idx < 0 || idx >= all.length) {
                return reply(`❌ No entry #${sub}. Vault has *${all.length}* entries (use 1–${all.length}).`);
            }
            await _sendEntry(sock, from, all[idx], idx + 1, all.length);
            return;
        }

        // ── SEND ALL ──────────────────────────────────────────────────────
        // Summary first
        await reply(
            `🗂️ *Retrieve Vault*\n\n` +
            `📦 *${filtered.length}* deleted message${filtered.length !== 1 ? 's' : ''} found` +
            (sub === 'group' ? ' *(groups only)*' : sub === 'dm' ? ' *(DMs only)*' : '') + `\n` +
            `⏱️ Entries expire in ≤2 hours\n\n` +
            `> Sending all now — newest first…`
        );

        // Batch send
        for (let i = 0; i < filtered.length; i++) {
            await _sendEntry(sock, from, filtered[i], i + 1, filtered.length);
            // Stagger to avoid WA rate-limiting
            if (filtered.length > 1) await _sleep(700);
        }

        await reply(
            `✅ *Done.* Sent *${filtered.length}* entr${filtered.length !== 1 ? 'ies' : 'y'}.\n\n` +
            `Use *.retrieve clear* to wipe the vault.`
        );
    },
};

// ── Helpers ───────────────────────────────────────────────────────

async function _sendEntry(sock, ownerJid, entry, idx, total) {
    const isGroup  = entry.jid?.endsWith('@g.us');
    const chatName = isGroup
        ? `Group · ${entry.jid.replace('@g.us', '')}`
        : `DM · ${entry.jid?.replace('@s.whatsapp.net', '')}`;

    const selfDeleted = entry.senderNum === entry.deleterNum;

    const header =
        `🗑️ *[${idx}/${total}]* — ${_timeAgo(entry.deletedAt)}\n` +
        `📌 *Chat:*      ${chatName}\n` +
        `✉️  *From:*      ${entry.senderNum || 'Unknown'}\n` +
        `🚮 *Deleted by:* ${selfDeleted ? '(themselves)' : (entry.deleterNum || 'Unknown')}\n` +
        `📎 *Type:*      ${entry.type}`;

    try {
        if (entry.type === 'text') {
            await sock.sendMessage(ownerJid, {
                text: `${header}\n\n💬 *Message:*\n${entry.body}`,
            });

        } else if (entry.mediaBuffer && entry.mediaBuffer.length > 500) {
            const cap = header + (entry.caption ? `\n\n📝 *Caption:* ${entry.caption}` : '');

            if (entry.type === 'image') {
                await sock.sendMessage(ownerJid, { image: entry.mediaBuffer, caption: cap });

            } else if (entry.type === 'video') {
                await sock.sendMessage(ownerJid, { video: entry.mediaBuffer, caption: cap });

            } else if (entry.type === 'sticker') {
                await sock.sendMessage(ownerJid, { sticker: entry.mediaBuffer });
                await sock.sendMessage(ownerJid, { text: header });

            } else if (entry.type === 'audio') {
                await sock.sendMessage(ownerJid, {
                    audio:    entry.mediaBuffer,
                    mimetype: entry.mimetype || 'audio/ogg; codecs=opus',
                    ptt:      !!entry.ptt,
                });
                await sock.sendMessage(ownerJid, { text: header });

            } else if (entry.type === 'document') {
                await sock.sendMessage(ownerJid, {
                    document: entry.mediaBuffer,
                    mimetype: entry.mimetype || 'application/octet-stream',
                    fileName: entry.fileName || 'recovered_file',
                    caption:  cap,
                });
            }

        } else {
            // Media entry but buffer is missing/empty (expired from WA servers)
            await sock.sendMessage(ownerJid, {
                text: `${header}\n\n⚠️ _(Media unavailable — may have expired on WhatsApp servers)_`,
            });
        }
    } catch (err) {
        console.error('[RETRIEVE] send error idx=' + idx, err.message);
        try {
            await sock.sendMessage(ownerJid, {
                text: `${header}\n\n❌ _(Error delivering this entry)_`,
            });
        } catch (_) {}
    }
}

function _typeBreakdown(entries) {
    const counts = {};
    for (const e of entries) counts[e.type] = (counts[e.type] || 0) + 1;
    return Object.entries(counts)
        .map(([t, n]) => `  • ${t}: ${n}`)
        .join('\n');
}

function _timeAgo(ts) {
    const diff = Math.floor((Date.now() - ts) / 1000);
    if (diff < 60)   return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    const h = Math.floor(diff / 3600);
    const m = Math.floor((diff % 3600) / 60);
    return `${h}h ${m}m ago`;
}

function _sleep(ms) { return new Promise(r => setTimeout(r, ms)); }
