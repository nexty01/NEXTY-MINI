/**
 * Shared in-memory store for pending .kickall confirmations.
 * Map key: groupJid -> { adminJid, expiresAt }
 */
const pending = new Map();
const TTL_MS = 60 * 1000;

function set(groupJid, adminJid) {
    pending.set(groupJid, { adminJid, expiresAt: Date.now() + TTL_MS });
}

function get(groupJid) {
    const entry = pending.get(groupJid);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        pending.delete(groupJid);
        return null;
    }
    return entry;
}

function clear(groupJid) {
    pending.delete(groupJid);
}

module.exports = { set, get, clear, TTL_MS };
