/**
 * AFK Command — SUKUNA MD
 * Usage : .afk [reason]
 *
 * How it works:
 *  • .afk sleeping       → sets AFK with reason "sleeping"
 *  • Someone @tags you   → bot auto-replies they're AFK + reason + time away
 *  • Someone quotes you  → same auto-reply
 *  • You send a message  → bot removes AFK, sends welcome-back with your name + duration
 *
 * Hooks wired in lib/sessionManager.js:
 *   afkMod.checkAFK(sock, msg, from, sender)      — every group message
 *   afkMod.checkMentionedAFK(sock, msg, from)     — every non-bot group message
 */

'use strict';

// In-memory store: `${groupJid}_${senderJid}` → { reason, time, name }
// Lives at module level so it persists for the whole process lifetime.
const afkUsers = new Map();

/* ─────────────────────────────────────────────
   DURATION FORMATTER
   Smart: shows only non-zero units.
   1d 3h 22m 5s  /  4h 2m  /  3m 10s  /  45s
───────────────────────────────────────────── */
function formatDuration(ms) {
    const total = Math.floor(ms / 1000);
    const d     = Math.floor(total / 86400);
    const h     = Math.floor((total % 86400) / 3600);
    const m     = Math.floor((total % 3600)  / 60);
    const s     = total % 60;
    const parts = [];
    if (d) parts.push(`${d}d`);
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (s || !parts.length) parts.push(`${s}s`);
    return parts.join(' ');
}

/* ─────────────────────────────────────────────
   EXTRACT CONTEXT INFO
   Works across text, image, video, audio, doc.
───────────────────────────────────────────── */
function getContextInfo(msg) {
    const m = msg?.message || {};
    return (
        m.extendedTextMessage?.contextInfo ||
        m.imageMessage?.contextInfo        ||
        m.videoMessage?.contextInfo        ||
        m.audioMessage?.contextInfo        ||
        m.documentMessage?.contextInfo     ||
        null
    );
}

module.exports = {
    name: 'afk',
    aliases: ['away', 'busy'],
    description: 'Set your AFK status with a reason',
    category: 'group',

    /* ═══════════════════════════════════════════
       .afk [reason]  — activate AFK
    ═══════════════════════════════════════════ */
    async execute({ reply, args, sender, from, pushName, msg }) {
        const reason  = args.join(' ').trim() || 'No reason given';
        const display = pushName || msg?.pushName || sender.split('@')[0];
        const afkKey  = `${from}_${sender}`;

        afkUsers.set(afkKey, {
            reason,
            time: Date.now(),
            name: display,
        });

        await reply(
            `*🌙 AFK MODE ACTIVATED*\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `👤 *User :* @${sender.split('@')[0]}\n` +
            `💬 *Reason :* ${reason}\n` +
            `🕐 *Since :* Just now\n` +
            `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
            `_Anyone who tags or replies to your messages\n` +
            `will be notified automatically._\n\n` +
            `> Send any message to turn off AFK.`
        );
    },

    /* ═══════════════════════════════════════════
       checkAFK  — called on EVERY group message
       Returns true if AFK was removed (welcome back fired).
    ═══════════════════════════════════════════ */
    async checkAFK(sock, msg, from, sender) {
        const afkKey = `${from}_${sender}`;
        if (!afkUsers.has(afkKey)) return false;

        const afkData  = afkUsers.get(afkKey);
        const duration = formatDuration(Date.now() - afkData.time);
        const display  = msg?.pushName || afkData.name || sender.split('@')[0];

        // Remove AFK BEFORE sending so if the message fails we don't loop
        afkUsers.delete(afkKey);

        try {
            await sock.sendMessage(from, {
                text:
                    `*🎉 WELCOME BACK!*\n` +
                    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                    `👋 Hey @${sender.split('@')[0]}!\n\n` +
                    `✅ *AFK removed*\n` +
                    `⏱️ *You were away for :* ${duration}\n` +
                    `📝 *Your reason was :* ${afkData.reason}\n` +
                    `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                    `_Good to have you back_ 💪`,
                mentions: [sender],
            });
        } catch (e) { /* non-fatal */ }

        return true;
    },

    /* ═══════════════════════════════════════════
       checkMentionedAFK  — called on every non-bot group message
       Checks both explicit @mentions AND quoted/replied-to messages.
    ═══════════════════════════════════════════ */
    async checkMentionedAFK(sock, msg, from) {
        const toCheck = new Set();

        // 1) Explicit @mentions in the message
        const ctx = getContextInfo(msg);
        for (const jid of (ctx?.mentionedJid || [])) {
            if (jid) toCheck.add(jid);
        }

        // 2) Quoted / replied-to message — check the ORIGINAL sender
        //    When user A replies to user B's message, contextInfo.participant = B
        if (ctx?.participant) toCheck.add(ctx.participant);

        if (!toCheck.size) return;

        const sender = msg?.key?.participant || msg?.key?.remoteJid || '';

        for (const jid of toCheck) {
            // Don't notify the person themselves (e.g. quoting their own msg while AFK)
            if (jid === sender) continue;

            const afkKey = `${from}_${jid}`;
            const afkData = afkUsers.get(afkKey);
            if (!afkData) continue;

            const duration = formatDuration(Date.now() - afkData.time);

            try {
                await sock.sendMessage(from, {
                    text:
                        `*💤 USER IS AFK*\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `⚠️ @${jid.split('@')[0]} is currently *away!*\n\n` +
                        `📝 *Reason :* ${afkData.reason}\n` +
                        `⏱️ *Away for :* ${duration}\n` +
                        `┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄\n` +
                        `_They'll be notified when they return._`,
                    mentions: [jid],
                });
            } catch (e) { /* non-fatal */ }
        }
    },
};
