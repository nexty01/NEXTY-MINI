/**
 * 👻 NEXTY MINI — Luxury Ghost Mode v2.0
 * ───────────────────────────────────────
 * Complete invisibility system with luxury UI.
 * 
 * Features:
 *  • No online status
 *  • No read receipts (blue ticks)
 *  • No typing indicator
 *  • No recording indicator
 *  • No auto-presence updates
 *  • Silent command execution for owner only
 *  • Live stats panel
 *  • Persist across restarts
 *  • Beautiful luxury boxes
 * 
 * Usage in index.js:
 *   case 'ghost': case 'ghostmode': 
 *     await commands.ghostmode(this.sock, from, msg, isOwner, this, args, botData, saveBotData); 
 *     break;
 */

const settings = require('../settings');

// ═══════════════════════════════════════════════════════════
//  MAIN GHOST MODE FUNCTION
// ═══════════════════════════════════════════════════════════
async function ghostmode(sock, from, msg, isOwner, session, args, botData, saveBotData) {
    try {
        // ─── Owner-only check ───
        if (!isOwner) {
            return await sock.sendMessage(from, { 
                text: formatBox(
                    '❌ ACCESS DENIED',
                    `╭─「 🔒 *SECURITY* 」──────────────\n` +
                    `│ Only the bot owner can\n` +
                    `│ toggle Ghost Mode.\n` +
                    `╰──────────────────────────────────\n\n` +
                    `> _Nice try though._ 😏`
                )
            }, { quoted: msg });
        }

        // ─── Parse arguments ───
        const action = (args[0] || '').toLowerCase().trim();

        // ═══════════════════════════════════════════════════════
        //  STATUS DISPLAY
        // ═══════════════════════════════════════════════════════
        if (!action || action === 'status' || action === 'info') {
            return await sendStatus(sock, from, msg, session);
        }

        // ═══════════════════════════════════════════════════════
        //  ENABLE GHOST MODE
        // ═══════════════════════════════════════════════════════
        if (action === 'on' || action === 'enable' || action === 'active') {
            if (session.ghostMode) {
                return await sock.sendMessage(from, { 
                    text: formatBox(
                        '⚠️ ALREADY ACTIVE',
                        `╭─「 👻 *GHOST STATUS* 」──────────\n` +
                        `│ 🟢 *State* : Already ACTIVE\n` +
                        `│ 🕐 *Since* : Bot startup\n` +
                        `╰──────────────────────────────────\n\n` +
                        `> _You're already invisible!_ 👻`
                    )
                }, { quoted: msg });
            }

            // ─── Activate ghost mode ───
            session.ghostMode = true;

            // ─── Persist to botData ───
            if (botData && typeof saveBotData === 'function') {
                if (!botData.statusSettings[session.userId]) {
                    botData.statusSettings[session.userId] = {};
                }
                botData.statusSettings[session.userId].ghostMode = true;
                try { saveBotData(); } catch (e) {}
            }

            // ─── Set presence to unavailable ───
            try {
                await sock.sendPresenceUpdate('unavailable');
            } catch (e) {}

            // ─── Send luxury activation message ───
            const enableMsg = 
                `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                `┃   👻 *GHOST MODE ACTIVATED* 👻   ┃\n` +
                `┃     _You are now invisible._      ┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                `╭─「 ✅ *ACTIVATION REPORT* 」─────\n` +
                `│ 🟢 *State*    : ACTIVE\n` +
                `│ 🕐 *Time*     : ${getTime()}\n` +
                `│ 📅 *Date*     : ${getDate()}\n` +
                `│ 👤 *Owner*    : ${settings.ownerName || 'NEXTY'}\n` +
                `│ 🔖 *Session*  : ${session.userId.substring(0, 12)}...\n` +
                `╰──────────────────────────────────\n\n` +
                `╭─「 🎯 *NOW HIDDEN* 」───────────\n` +
                `│ 🚫 Online status   : HIDDEN\n` +
                `│ 🚫 Read receipts   : OFF\n` +
                `│ 🚫 Typing indicator: OFF\n` +
                `│ 🚫 Recording       : OFF\n` +
                `│ 🚫 Auto-react      : OFF\n` +
                `│ 🚫 AI auto-reply   : OFF\n` +
                `│ 🕵️ Commands        : OWNER ONLY\n` +
                `╰──────────────────────────────────\n\n` +
                `╭─「 💡 *WHAT HAPPENS NOW* 」─────\n` +
                `│ 👁️ Others see you OFFLINE\n` +
                `│ 📩 Messages won't get\n` +
                `│     blue ticks\n` +
                `│ 🤐 Bot won't react or reply\n` +
                `│     to strangers\n` +
                `│ ✅ You (owner) still control\n` +
                `│     everything\n` +
                `╰──────────────────────────────────\n\n` +
                `> _Ninja mode engaged._ 🥷\n\n` +
                `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                `┃  💎 _Built Different. Charged Up._ ┃\n` +
                `┃  ⚡ *POWERED BY NEXTY MINI* ⚡     ┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(from, { text: enableMsg }, { quoted: msg });
        }

        // ═══════════════════════════════════════════════════════
        //  DISABLE GHOST MODE
        // ═══════════════════════════════════════════════════════
        if (action === 'off' || action === 'disable' || action === 'inactive') {
            if (!session.ghostMode) {
                return await sock.sendMessage(from, { 
                    text: formatBox(
                        '⚠️ ALREADY OFF',
                        `╭─「 👁️ *GHOST STATUS* 」─────────\n` +
                        `│ 🔴 *State* : Already INACTIVE\n` +
                        `│ 👁️ *Presence* : Visible\n` +
                        `╰──────────────────────────────────\n\n` +
                        `> _You're already visible!_ 👁️`
                    )
                }, { quoted: msg });
            }

            // ─── Deactivate ghost mode ───
            session.ghostMode = false;

            // ─── Persist to botData ───
            if (botData && typeof saveBotData === 'function') {
                if (!botData.statusSettings[session.userId]) {
                    botData.statusSettings[session.userId] = {};
                }
                botData.statusSettings[session.userId].ghostMode = false;
                try { saveBotData(); } catch (e) {}
            }

            // ─── Restore presence ───
            try {
                await sock.sendPresenceUpdate('available');
            } catch (e) {}

            // ─── Send luxury deactivation message ───
            const disableMsg = 
                `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                `┃   👁️ *GHOST MODE DISABLED*      ┃\n` +
                `┃    _Welcome back to reality._     ┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
                `╭─「 🔴 *DEACTIVATION REPORT* 」───\n` +
                `│ 🔴 *State*    : INACTIVE\n` +
                `│ 🕐 *Time*     : ${getTime()}\n` +
                `│ 📅 *Date*     : ${getDate()}\n` +
                `│ 👤 *Owner*    : ${settings.ownerName || 'NEXTY'}\n` +
                `╰──────────────────────────────────\n\n` +
                `╭─「 ✅ *NOW VISIBLE* 」──────────\n` +
                `│ 👁️ Online status   : VISIBLE\n` +
                `│ ✅ Read receipts   : ON\n` +
                `│ 💬 Typing indicator: ON\n` +
                `│ 🎤 Recording       : ON\n` +
                `│ ⚡ Auto-react      : ON\n` +
                `│ 🤖 AI auto-reply   : ON\n` +
                `│ 🌐 Commands        : PUBLIC\n` +
                `╰──────────────────────────────────\n\n` +
                `> _Bot is now visible to everyone._ 👁️\n\n` +
                `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
                `┃  💎 _Built Different. Charged Up._ ┃\n` +
                `┃  ⚡ *POWERED BY NEXTY MINI* ⚡     ┃\n` +
                `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

            return await sock.sendMessage(from, { text: disableMsg }, { quoted: msg });
        }

        // ═══════════════════════════════════════════════════════
        //  TOGGLE
        // ═══════════════════════════════════════════════════════
        if (action === 'toggle') {
            const newState = !session.ghostMode;
            return await ghostmode(sock, from, msg, isOwner, session, [newState ? 'on' : 'off'], botData, saveBotData);
        }

        // ═══════════════════════════════════════════════════════
        //  HELP / INVALID
        // ═══════════════════════════════════════════════════════
        const helpMsg = 
            `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
            `┃   👻 *GHOST MODE HELP* 👻        ┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            `╭─「 ⚙️ *AVAILABLE COMMANDS* 」────\n` +
            `│ ▸ .ghost on      → Activate\n` +
            `│ ▸ .ghost off     → Deactivate\n` +
            `│ ▸ .ghost status  → Check state\n` +
            `│ ▸ .ghost toggle  → Toggle\n` +
            `│ ▸ .ghost         → This help\n` +
            `╰──────────────────────────────────\n\n` +
            `╭─「 💡 *EXAMPLES* 」──────────────\n` +
            `│ .ghost on\n` +
            `│ .ghost status\n` +
            `│ .ghost off\n` +
            `╰──────────────────────────────────\n\n` +
            `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
            `┃  ⚡ *POWERED BY NEXTY MINI* ⚡    ┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        return await sock.sendMessage(from, { text: helpMsg }, { quoted: msg });

    } catch (err) {
        console.error('[ghostmode] Error:', err.message);
        try {
            await sock.sendMessage(from, { 
                text: `❌ *Ghost Mode Error*\n\n\`${err.message}\`` 
            }, { quoted: msg });
        } catch (e) {}
    }
}

// ═══════════════════════════════════════════════════════════
//  STATUS DISPLAY FUNCTION
// ═══════════════════════════════════════════════════════════
async function sendStatus(sock, from, msg, session) {
    const isActive = session.ghostMode;
    const statusEmoji = isActive ? '🟢' : '🔴';
    const statusText = isActive ? '👻 *ACTIVE*' : '❌ *INACTIVE*';
    const presence = isActive ? '🚫 HIDDEN' : '👁️ VISIBLE';
    const receipt = isActive ? '🚫 OFF' : '✅ ON';
    const typing = isActive ? '🚫 OFF' : '✅ ON';
    const reaction = isActive ? '🚫 OFF' : '✅ ON';
    const aiReply = isActive ? '🚫 OFF' : '✅ ON';
    const cmdAccess = isActive ? '🔒 OWNER ONLY' : '🌐 PUBLIC';

    // Uptime
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);

    const statusMsg = 
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃    👻 *GHOST MODE CONTROL* 👻    ┃\n` +
        `┃       _Luxury Stealth System_      ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `╭─「 📊 *CURRENT STATUS* 」────────\n` +
        `│ ${statusEmoji} *State*     : ${statusText}\n` +
        `│ 👁️ *Presence*  : ${presence}\n` +
        `│ 📩 *Read*      : ${receipt}\n` +
        `│ 💬 *Typing*    : ${typing}\n` +
        `│ ⚡ *Auto-React* : ${reaction}\n` +
        `│ 🤖 *AI Reply*  : ${aiReply}\n` +
        `│ 🎯 *Commands*  : ${cmdAccess}\n` +
        `╰──────────────────────────────────\n\n` +
        `╭─「 🌐 *BOT INFO* 」──────────────\n` +
        `│ 🤖 *Name*      : NEXTY MINI\n` +
        `│ 👤 *Owner*     : ${settings.ownerName || 'NEXTY'}\n` +
        `│ 📦 *Version*   : v${settings.version || '3.0.0'}\n` +
        `│ 🕐 *Uptime*    : ${h}h ${m}m ${s}s\n` +
        `│ 🔖 *Session*   : ${session.userId.substring(0, 12)}...\n` +
        `╰──────────────────────────────────\n\n` +
        `╭─「 🎯 *WHAT IT DOES* 」──────────\n` +
        `│ 🚫 No online status\n` +
        `│ 🚫 No read receipts (blue ticks)\n` +
        `│ 🚫 No typing indicator\n` +
        `│ 🚫 No recording indicator\n` +
        `│ 🚫 No auto-presence updates\n` +
        `│ 🕵️ Silent command execution\n` +
        `│ 🔒 Only owner can control\n` +
        `╰──────────────────────────────────\n\n` +
        `╭─「 ⚙️ *COMMANDS* 」──────────────\n` +
        `│ ▸ .ghost on      → Activate\n` +
        `│ ▸ .ghost off     → Deactivate\n` +
        `│ ▸ .ghost status  → This panel\n` +
        `│ ▸ .ghost toggle  → Flip state\n` +
        `╰──────────────────────────────────\n\n` +
        `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
        `┃  💎 _Built Different. Charged Up._ ┃\n` +
        `┃  ⚡ *POWERED BY NEXTY MINI* ⚡     ┃\n` +
        `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

    try {
        // Send with cyberpunk image
        try {
            return await sock.sendMessage(from, { 
                image: { url: 'https://files.catbox.moe/o0798k.png' }, 
                caption: statusMsg 
            }, { quoted: msg });
        } catch (imgErr) {
            // Fallback: settings.startimage
            try {
                return await sock.sendMessage(from, { 
                    image: { url: settings.startimage }, 
                    caption: statusMsg 
                }, { quoted: msg });
            } catch (e) {
                // Final fallback: text only
                return await sock.sendMessage(from, { text: statusMsg }, { quoted: msg });
            }
        }
    } catch (e) {
        console.error('[ghostmode] Status send failed:', e.message);
    }
}

// ═══════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════
function formatBox(title, body) {
    return `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
           `┃  ${title.padEnd(32)}┃\n` +
           `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n${body}`;
}

function getTime() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: true 
    });
}

function getDate() {
    const now = new Date();
    return now.toLocaleDateString('en-US', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
    });
}

// ═══════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════
module.exports = ghostmode;
module.exports.ghostmode = ghostmode;