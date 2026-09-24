'use strict';
/**
 * Recover engine — anti-delete, anti-edit and anti-status-delete.
 *
 * Works for personal inboxes, groups AND statuses. Two switches decide where an
 * alert is needed:
 *   • bot-wide (owner)   → stored on database.getGroup(<bot number>):
 *         antidelete / antiedit / antistatusdelete
 *     Covers EVERY chat (DMs + groups + statuses); alerts are delivered to the
 *     owner's own inbox (the paired number's chat with itself).
 *   • per-group (admins)  → database.getGroup(<group jid>).antidelete / antiedit
 *     Alert is posted in that group (public mode) or the owner's inbox (private
 *     mode, so unauthorized members never see a bot message).
 *
 * Events are read from BOTH `messages.upsert` (protocolMessage revoke/edit, incl.
 * the `editedMessage` wrapper) and `messages.update` (what current Baileys emits
 * for edits/revokes), de-duplicated so an event is reported once.
 */

const database = require('../utils/database');
const access = require('./access');

const MEDIA = {
    imageMessage: { type: 'image', key: 'image', label: '📷 Image' },
    videoMessage: { type: 'video', key: 'video', label: '🎬 Video' },
    audioMessage: { type: 'audio', key: 'audio', label: '🎧 Audio' },
    documentMessage: { type: 'document', key: 'document', label: '📄 Document' },
    stickerMessage: { type: 'sticker', key: 'sticker', label: '🏷️ Sticker' },
};
const MAX_MEDIA_BYTES = 16 * 1024 * 1024;      // per file kept for recovery
const MAX_MEDIA_TOTAL = 96 * 1024 * 1024;      // whole buffer store
const STATUS_JID = 'status@broadcast';

const digits = (jid) => String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');

function unwrap(message) {
    let m = message || {};
    for (let i = 0; i < 6; i++) {
        const inner = m.ephemeralMessage?.message || m.viewOnceMessage?.message || m.viewOnceMessageV2?.message
            || m.viewOnceMessageV2Extension?.message || m.documentWithCaptionMessage?.message
            || m.editedMessage?.message;
        if (!inner) break;
        m = inner;
    }
    return m;
}
function bodyOf(message) {
    const m = unwrap(message);
    return m.conversation || m.extendedTextMessage?.text || m.imageMessage?.caption
        || m.videoMessage?.caption || m.documentMessage?.caption || null;
}
function mediaOf(message) {
    const m = unwrap(message);
    for (const [key, info] of Object.entries(MEDIA)) if (m[key]) return { ...info, msgKey: key, media: m[key] };
    return null;
}

class RecoverEngine {
    /** @param {object} host  object owning `_msgCache` (Map<jid, Map<id, msg>>) */
    constructor(host) {
        this.host = host;
        this.seen = new Map();          // dedupe: eventKey -> ts
        this.mediaBuf = new Map();      // `${jid}:${id}` -> { buf, mimetype, ... } (insertion ordered = LRU)
        this.mediaBytes = 0;
        this.downloader = null;         // overridable in tests
    }

    // ── settings ────────────────────────────────────────────────────────
    _flags(phone) {
        const rec = database.getGroup(phone) || {};
        return { antidelete: !!rec.antidelete, antiedit: !!rec.antiedit, antistatus: !!rec.antistatusdelete };
    }
    anyEnabledFor(phone, jid) {
        const f = this._flags(phone);
        if (jid === STATUS_JID) return f.antistatus;
        if (f.antidelete || f.antiedit) return true;
        if (String(jid).endsWith('@g.us')) { const g = database.getGroup(jid) || {}; return !!(g.antidelete || g.antiedit); }
        return false;
    }
    destinations(kind, phone, jid) {
        const inbox = `${digits(phone)}@s.whatsapp.net`;
        const f = this._flags(phone);
        const out = new Set();
        if (jid === STATUS_JID) { if (f.antistatus) out.add(inbox); return [...out]; }
        if (f[kind === 'delete' ? 'antidelete' : 'antiedit']) out.add(inbox);
        if (String(jid).endsWith('@g.us')) {
            const g = database.getGroup(jid) || {};
            if (g[kind === 'delete' ? 'antidelete' : 'antiedit']) out.add(access.isPrivate() ? inbox : jid);
        }
        return [...out];
    }

    // ── cache helpers ───────────────────────────────────────────────────
    _find(jid, id) {
        const cache = this.host._msgCache;
        const direct = cache.get(jid)?.get(id);
        if (direct) return direct;
        for (const chat of cache.values()) { const hit = chat.get(id); if (hit) return hit; }
        return null;
    }
    _dupe(key) {
        const now = Date.now();
        if (this.seen.has(key)) return true;
        this.seen.set(key, now);
        if (this.seen.size > 800) for (const [k, t] of this.seen) if (now - t > 10 * 60 * 1000) this.seen.delete(k);
        return false;
    }
    async _download(sock, media, type) {
        if (this.downloader) return this.downloader(media, type);
        const { downloadContentFromMessage } = require('@pasqua-baileys/baileys');
        const stream = await downloadContentFromMessage(media, type);
        const chunks = [];
        for await (const chunk of stream) chunks.push(chunk);
        return Buffer.concat(chunks);
    }

    /** Called for every incoming message: keep media bytes so they survive deletion. */
    async remember(sock, phone, m) {
        try {
            const jid = m.key?.remoteJid;
            if (!jid || !m.key?.id || m.key.fromMe || !m.message || m.message.protocolMessage) return;
            if (!this.anyEnabledFor(phone, jid)) return;
            const info = mediaOf(m.message);
            if (!info) return;
            const declared = Number(info.media.fileLength?.low ?? info.media.fileLength) || 0;
            if (declared > MAX_MEDIA_BYTES) return;
            const buf = await this._download(sock, info.media, info.type);
            if (!buf || !buf.length || buf.length > MAX_MEDIA_BYTES) return;
            const key = `${jid}:${m.key.id}`;
            this.mediaBuf.set(key, { buf, ...info });
            this.mediaBytes += buf.length;
            for (const [k, v] of this.mediaBuf) {
                if (this.mediaBytes <= MAX_MEDIA_TOTAL) break;
                this.mediaBytes -= v.buf.length; this.mediaBuf.delete(k);
            }
        } catch (_) { /* best effort */ }
    }

    // ── event entry points ──────────────────────────────────────────────
    /** From messages.upsert (protocolMessage revoke/edit incl. editedMessage wrapper). */
    async onUpsert(sock, phone, m) {
        const jid = m.key?.remoteJid;
        if (!jid || !m.message) return;
        const outer = m.message;
        const wrapped = outer.editedMessage?.message || null;                 // FutureProof wrapper
        const proto = outer.protocolMessage || wrapped?.protocolMessage || null;
        if (!proto) return;
        const actor = m.key.participant || m.key.remoteJid;
        if (proto.type === 0 && proto.key?.id) {                              // REVOKE
            return this._delete(sock, phone, { jid, id: proto.key.id, actor, byMe: !!m.key.fromMe, pushName: m.pushName, statusPoster: jid === STATUS_JID ? actor : null });
        }
        if ((proto.type === 14 || wrapped) && proto.key?.id) {                // EDIT
            return this._edit(sock, phone, { jid, id: proto.key.id, actor, byMe: !!m.key.fromMe, newMessage: proto.editedMessage, pushName: m.pushName });
        }
    }
    /** From messages.update (what current Baileys emits for edits and revokes). */
    async onUpdate(sock, phone, updates) {
        for (const u of updates || []) {
            try {
                const key = u?.key; const upd = u?.update || {};
                if (!key?.remoteJid || !key.id) continue;
                const actor = key.participant || key.remoteJid;
                const stub = upd.messageStubType;
                if (stub === 1 || stub === 'REVOKE') {
                    await this._delete(sock, phone, { jid: key.remoteJid, id: key.id, actor, byMe: !!key.fromMe, statusPoster: key.remoteJid === STATUS_JID ? actor : null });
                    continue;
                }
                const edited = upd.message?.editedMessage?.message || upd.message?.protocolMessage?.editedMessage || null;
                if (edited) {
                    await this._edit(sock, phone, { jid: key.remoteJid, id: key.id, actor, byMe: !!key.fromMe, newMessage: edited });
                }
            } catch (e) { console.error('[RECOVER update]', e.message); }
        }
    }

    // ── alert builders ──────────────────────────────────────────────────
    async _chatLabel(sock, jid, pushName) {
        if (jid === STATUS_JID) return 'Status';
        if (jid.endsWith('@g.us')) {
            try { const meta = await sock.groupMetadata(jid); return `Group — ${meta?.subject || jid.split('@')[0]}`; } catch (_) { return 'Group'; }
        }
        return `Personal chat — ${pushName ? pushName + ' ' : ''}+${digits(jid)}`;
    }
    async _send(sock, dests, payload) {
        for (const to of dests) { try { await sock.sendMessage(to, payload); } catch (e) { console.error('[RECOVER send]', e.message); } }
    }

    async _delete(sock, phone, ev) {
        const { jid, id, actor, byMe } = ev;
        const dests = this.destinations('delete', phone, jid);
        if (!dests.length || byMe) return;
        if (this._dupe(`d:${jid}:${id}`)) return;

        const orig = this._find(jid, id);
        if (orig?.key?.fromMe) return;                                         // owner's own message
        const sender = orig?.key?.participant || ev.statusPoster || orig?.key?.remoteJid || actor;
        const chat = await this._chatLabel(sock, jid, orig?.pushName || ev.pushName);
        const title = jid === STATUS_JID ? '🗑️ *ANTI-STATUS DELETE ALERT*' : '🗑️ *ANTI-DELETE ALERT*';
        const header =
            `${title}\n\n📍 *Chat:* ${chat}\n` +
            (jid === STATUS_JID ? '' : `👤 *Deleted by:* @${digits(actor)}\n`) +
            `✉️ *${jid === STATUS_JID ? 'Status of' : 'Originally from'}:* @${digits(sender)}\n\n`;
        const mentions = [...new Set([actor, sender].filter(Boolean))];

        if (!orig) {
            return this._send(sock, dests, { text: header + '_Original content is not available (sent before the bot saw it)._', mentions });
        }
        const text = bodyOf(orig.message);
        const info = mediaOf(orig.message);
        if (!info) {
            return this._send(sock, dests, { text: header + (text ? `💬 *Message:*\n${text}` : '_Unsupported message type._'), mentions });
        }
        // media: prefer bytes captured on arrival, else try downloading now
        let buf = this.mediaBuf.get(`${jid}:${id}`)?.buf || null;
        if (!buf) { try { buf = await this._download(sock, info.media, info.type); } catch (_) { buf = null; } }
        if (!buf || !buf.length) {
            return this._send(sock, dests, { text: header + `${info.label} could not be recovered.${text ? `\n\n💬 *Caption:*\n${text}` : ''}`, mentions });
        }
        const cap = header + `${info.label}${text ? `\n💬 *Caption:*\n${text}` : ''}`;
        const payload = { [info.key]: buf };
        if (info.type === 'image' || info.type === 'video') payload.caption = cap;
        if (info.type === 'audio') { payload.mimetype = info.media.mimetype || 'audio/ogg; codecs=opus'; payload.ptt = !!info.media.ptt; }
        if (info.type === 'document') { payload.mimetype = info.media.mimetype || 'application/octet-stream'; payload.fileName = info.media.fileName || 'recovered_file'; payload.caption = cap; }
        if (info.type === 'video') payload.mimetype = info.media.mimetype || 'video/mp4';
        payload.mentions = mentions;
        await this._send(sock, dests, payload);
        if (info.type === 'audio' || info.type === 'sticker') await this._send(sock, dests, { text: cap, mentions });
        this.mediaBytes -= this.mediaBuf.get(`${jid}:${id}`)?.buf.length || 0;
        this.mediaBuf.delete(`${jid}:${id}`);
    }

    async _edit(sock, phone, ev) {
        const { jid, id, actor, byMe } = ev;
        const dests = this.destinations('edit', phone, jid);
        if (!dests.length || byMe || jid === STATUS_JID) return;
        const orig = this._find(jid, id);
        if (orig?.key?.fromMe) return;
        const newBody = bodyOf(ev.newMessage) || '_(media/unknown)_';
        if (this._dupe(`e:${jid}:${id}:${newBody}`)) return;

        const oldBody = orig ? (bodyOf(orig.message) || '_(media/unknown)_') : '_(original not seen by the bot)_';
        const sender = orig?.key?.participant || actor;
        const chat = await this._chatLabel(sock, jid, orig?.pushName || ev.pushName);
        const text =
            `✏️ *ANTI-EDIT ALERT*\n\n📍 *Chat:* ${chat}\n👤 *Edited by:* @${digits(sender)}\n\n` +
            `📜 *Original:*\n${oldBody}\n\n✏️ *Edited to:*\n${newBody}`;
        await this._send(sock, dests, { text, mentions: [sender].filter(Boolean) });

        // Keep the cache current so a second edit shows the previous edit as "original".
        if (orig) orig.message = ev.newMessage && Object.keys(ev.newMessage).length ? ev.newMessage : orig.message;
    }
}

module.exports = { RecoverEngine, bodyOf, mediaOf, unwrap, STATUS_JID };
