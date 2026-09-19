/**
 * autoAddEngine.js — Auto-Approve join requests, bot-wide.
 *
 * WhatsApp/Baileys has no push event for a single new join request (unlike
 * group-participants.update for adds/removes), so this runs as a light
 * poll loop: every POLL_INTERVAL_MS it walks every group the bot is admin
 * of, lists pending requests via groupRequestParticipantsList (same API
 * commands/admin/approve.js already uses), and tracks first-seen time per
 * request. Once a request has been pending >= the configured delay AND
 * matches the country-code filter, it gets approved via
 * groupRequestParticipantsUpdate(..., 'approve') — same call approve.js uses.
 *
 * Settings (bot-wide, not per-group) live in database.getAutoAdd()/setAutoAdd():
 *   enabled       — on/off switch
 *   delaySeconds  — how long a request must sit pending before auto-approval
 *   countryCode   — 'all', or a specific country code string (e.g. '234')
 *                   to only approve requests from numbers starting with it
 */
'use strict';

const database = require('../utils/database');

const POLL_INTERVAL_MS      = 60000; // was 15000 — too aggressive, tripped WhatsApp's rate limit
const GROUP_LIST_TTL_MS     = 5 * 60 * 1000; // only re-fetch the full group list every 5 min
const STALE_CUTOFF_MS       = 60 * 60 * 1000; // drop tracking for requests untouched 1hr+

// Module-level (single bot account per process) — key: `${groupId}:${jid}`
const _firstSeen = new Map();

// Cached group list so we don't call groupFetchAllParticipating() every poll —
// that call is also used by /globalstatus, and hammering it every 15s from
// two places is exactly what produces "rate-overlimit".
let _groupsCache    = null;
let _groupsCachedAt = 0;

async function getGroupsCached(sock) {
    const now = Date.now();
    if (_groupsCache && (now - _groupsCachedAt) < GROUP_LIST_TTL_MS) {
        return _groupsCache;
    }
    const groupsMap = await sock.groupFetchAllParticipating();
    _groupsCache    = groupsMap;
    _groupsCachedAt = now;
    return groupsMap;
}

function extractDigits(jid) {
    return String(jid || '').split('@')[0].split(':')[0].replace(/\D/g, '');
}

function matchesCountryCode(jid, cc) {
    if (!cc || String(cc).toLowerCase() === 'all') return true;
    return extractDigits(jid).startsWith(String(cc));
}

async function pollOnce(sock) {
    const settings = database.getAutoAdd();
    if (!settings.enabled) return;

    let groupsMap;
    try {
        groupsMap = await getGroupsCached(sock);
    } catch (e) {
        console.error('[AUTO-ADD] failed to fetch groups:', e.message);
        return;
    }

    const botSelf  = sock.user?.id;
    const botPhone = extractDigits(botSelf);
    const now      = Date.now();
    const activeKeys = new Set();

    for (const groupId of Object.keys(groupsMap || {})) {
        let meta;
        try {
            meta = await sock.groupMetadata(groupId);
        } catch (_) { continue; }

        const botIsAdmin = meta?.participants?.some(p => {
            const pPhone = extractDigits(p.id);
            return (p.id === botSelf || pPhone === botPhone) && p.admin;
        });
        if (!botIsAdmin) continue;

        let pending;
        try {
            pending = await sock.groupRequestParticipantsList(groupId);
        } catch (_) { continue; }
        if (!pending?.length) continue;

        const toApprove = [];
        for (const req of pending) {
            const key = `${groupId}:${req.jid}`;
            activeKeys.add(key);

            if (!_firstSeen.has(key)) {
                _firstSeen.set(key, now);
                continue; // just discovered this poll — start the delay clock
            }
            const waitedMs = now - _firstSeen.get(key);
            if (waitedMs < settings.delaySeconds * 1000) continue;
            if (!matchesCountryCode(req.jid, settings.countryCode)) continue;
            toApprove.push(req.jid);
        }

        if (toApprove.length) {
            try {
                await sock.groupRequestParticipantsUpdate(groupId, toApprove, 'approve');
                for (const jid of toApprove) _firstSeen.delete(`${groupId}:${jid}`);
                console.log(`[AUTO-ADD] approved ${toApprove.length} request(s) in ${meta.subject || groupId}`);
            } catch (e) {
                console.error(`[AUTO-ADD] approve failed in ${groupId}:`, e.message);
            }
        }
    }

    // Prune tracking for requests that vanished (cancelled/expired) or went stale.
    for (const [key, ts] of _firstSeen) {
        if (!activeKeys.has(key) || (now - ts) > STALE_CUTOFF_MS) {
            _firstSeen.delete(key);
        }
    }
}

function startAutoAddEngine(sock) {
    const timer = setInterval(() => {
        pollOnce(sock).catch(e => console.error('[AUTO-ADD] poll error:', e.message));
    }, POLL_INTERVAL_MS);
    // Fire one pass shortly after startup too, don't wait a full interval.
    setTimeout(() => pollOnce(sock).catch(e => console.error('[AUTO-ADD] poll error:', e.message)), 5000);
    return timer;
}

module.exports = { startAutoAddEngine };
