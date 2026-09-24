'use strict';
/**
 * Central access control — the ONLY place that decides
 *   1. whether an incoming message may receive any bot response (mode gate)
 *   2. whether a given command may run for a given sender (permission rules)
 *
 * Both pipelines (index.js BotSession and lib/sessionManager.js) call into
 * this module, so private/public mode can no longer disagree between them.
 *
 * Identity (owner / sudo / mod / group-admin) is resolved by the caller
 * (sessionManager knows the @lid <-> phone maps); this module only applies
 * the rules to already-resolved booleans, which keeps it pure and testable.
 */

const database = require('../utils/database');

const MODES = Object.freeze({ PRIVATE: 'private', PUBLIC: 'public' });

// Accepted spellings for `.mode <x>`
const MODE_ALIASES = Object.freeze({
    private: MODES.PRIVATE, self: MODES.PRIVATE, lock: MODES.PRIVATE,
    public: MODES.PUBLIC, normal: MODES.PUBLIC, everyone: MODES.PUBLIC, unlock: MODES.PUBLIC,
});

function parseMode(value) {
    return MODE_ALIASES[String(value || '').trim().toLowerCase()] || null;
}

function getMode() { return database.getBotMode(); }
function isPrivate() { return getMode() === MODES.PRIVATE; }
function setMode(mode) {
    const parsed = parseMode(mode);
    if (!parsed) throw new Error(`Invalid mode: ${mode}`);
    return database.setBotMode(parsed);
}

/**
 * Mode gate. In private mode ONLY the real owner and explicitly configured
 * sudo users may trigger any response (commands, AI, chatbot, buttons,
 * auto-reactions, welcome messages …). Mods and group admins do NOT count.
 */
function canReceiveReplies({ isOwner = false, isSudo = false } = {}) {
    if (!isPrivate()) return true;
    return isOwner === true || isSudo === true;
}

/**
 * Command permission rules (runs AFTER the mode gate).
 *   ownerOnly  → real owner only
 *   sudoOnly   → owner or configured sudo
 *   adminOnly  → owner, sudo, or valid group admin
 *   groupOnly  → must be used inside a group
 *   category "owner" without ownerOnly keeps the historical behaviour
 *   (owner or a mod set by the owner) — mods never pass ownerOnly.
 * Public mode never bypasses any of these.
 *
 * Returns { allowed, reason, reply }. `reply` is null when the refusal must
 * be silent (private mode).
 */
function authorizeCommand(command, ctx = {}) {
    const { isGroup = false, isOwner = false, isSudo = false, isMod = false, isAdmin = false } = ctx;
    if (!command) return { allowed: false, reason: 'unknown', reply: null };

    if (!canReceiveReplies({ isOwner, isSudo })) {
        return { allowed: false, reason: 'private', reply: null };
    }
    if (command.groupOnly && !isGroup) {
        return { allowed: false, reason: 'group', reply: '👥 *Group command.* This command only works inside a WhatsApp group — try it in a group chat.' };
    }
    if (command.ownerOnly && !isOwner) {
        return { allowed: false, reason: 'owner', reply: '🔒 *This command is reserved for the bot owner only.*' };
    }
    if (command.sudoOnly && !(isOwner || isSudo)) {
        return { allowed: false, reason: 'sudo', reply: '🔒 *This command requires sudo permission.*' };
    }
    if (command.category === 'owner' && !command.ownerOnly && !(isOwner || isMod)) {
        return { allowed: false, reason: 'owner', reply: '🔒 *This command is reserved for the bot owner only.*' };
    }
    if (command.adminOnly && !(isOwner || isSudo || isAdmin)) {
        return { allowed: false, reason: 'admin', reply: '🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.' };
    }
    return { allowed: true, reason: 'ok', reply: null };
}

// ── Group-admin matching (phone JIDs, device JIDs and @lid JIDs) ──────────
function _digits(v) { return String(v || '').split('@')[0].split(':')[0].replace(/\D/g, ''); }
function _bare(v) {
    const raw = String(v || '');
    const at = raw.indexOf('@');
    return at === -1 ? raw.split(':')[0] : raw.slice(0, at).split(':')[0] + raw.slice(at);
}

/**
 * @param {Array} participants  Baileys group participants
 * @param {Iterable<string>} senderIds  every known id of the sender (lid, phone jid, bare digits…)
 */
function isAdminInParticipants(participants, senderIds) {
    if (!Array.isArray(participants)) return false;
    const ids = new Set();
    for (const raw of senderIds || []) {
        if (!raw) continue;
        ids.add(String(raw));
        ids.add(_bare(raw));
        const d = _digits(raw);
        if (d) ids.add(d);
    }
    if (!ids.size) return false;
    return participants.some(p => {
        if (!p || (p.admin !== 'admin' && p.admin !== 'superadmin')) return false;
        return [p.id, p.jid, p.lid, p.phoneNumber].filter(Boolean).some(v => {
            const bare = _bare(v);
            const d = _digits(v);
            // Compare bare JIDs (same namespace) — a lid never equals a phone by digits alone
            // unless the caller supplied both forms in senderIds.
            return ids.has(String(v)) || ids.has(bare) || (!bare.endsWith('@lid') && d && ids.has(d));
        });
    });
}

module.exports = {
    MODES, parseMode, getMode, isPrivate, setMode,
    canReceiveReplies, authorizeCommand, isAdminInParticipants,
};
