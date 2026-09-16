/**
 * 👑 NEXTY MINI — Luxury Owner Command
 * ─────────────────────────────────────
 * Professional luxury owner info with cyberpunk image.
 */

const settings = require('../settings');
const os = require('os');   // ✅ YE LINE ADD KIYA

// ═══════════════════════════════════════════════════════════
//  MAIN OWNER COMMAND
// ═══════════════════════════════════════════════════════════
async function ownerCommand(sock, from, msg) {
    try {
        // ─── Live stats ───
        const uptime = process.uptime();
        const h = Math.floor(uptime / 3600);
        const m = Math.floor((uptime % 3600) / 60);
        const s = Math.floor(uptime % 60);
        const uptimeStr = `${h}h ${m}m ${s}s`;

        const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
        const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);

        // ─── Time & Date ───
        const now = new Date();
        const time = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
        const date = now.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });

        // ═══════════════════════════════════════════════════════
        //  LUXURY OWNER MESSAGE
        // ═══════════════════════════════════════════════════════
        const ownerText = 
            `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
            `┃     👑 *NEXTY MINI OWNER* 👑     ┃\n` +
            `┃    _Built Different. Charged Up._  ┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
            
            `╭─「 👤 *OWNER INFO* 」────────────\n` +
            `│ ▸ *Name*     : ${settings.ownerName || 'NEXTY'}\n` +
            `│ ▸ *Number*   : +${settings.ownerNumber || 'Not Set'}\n` +
            `│ ▸ *Role*     : Founder & Developer\n` +
            `│ ▸ *Status*   : 👻 Ghost Mode Ready\n` +
            `╰──────────────────────────────────\n\n` +
            
            `╭─「 📞 *CONTACT* 」───────────────\n` +
            `│ ▸ *WhatsApp* : wa.me/${settings.ownerNumber}\n` +
            `│ ▸ *Channel*  : Follow below 👇\n` +
            `╰──────────────────────────────────\n\n` +
            
            `╭─「 🔗 *OFFICIAL CHANNEL* 」──────\n` +
            `│ ▸ https://whatsapp.com/channel/\n` +
            `│   0029Vb8RIvDHVvTgHqEiRY1N\n` +
            `╰──────────────────────────────────\n\n` +
            
            `╭─「 🤖 *BOT INFO* 」──────────────\n` +
            `│ ▸ *Name*     : NEXTY MINI\n` +
            `│ ▸ *Version*  : v${settings.version || '3.0.0'}\n` +
            `│ ▸ *Commands* : 300+ Elite\n` +
            `│ ▸ *Status*   : 🟢 Online 24/7\n` +
            `│ ▸ *Uptime*   : ${uptimeStr}\n` +
            `│ ▸ *RAM*      : ${usedMem}MB / ${totalMem}MB\n` +
            `│ ▸ *Time*     : ${time}\n` +
            `│ ▸ *Date*     : ${date}\n` +
            `╰──────────────────────────────────\n\n` +
            
            `╭━「 💎 *PREMIUM FEATURES* 」━━━━━\n` +
            `│ ✨ Luxury Menu UI\n` +
            `│ 👻 Ghost Mode (Silent)\n` +
            `│ 🎵 Song/Video Downloader\n` +
            `│ 🛡️ Anti-Link & Anti-Call\n` +
            `│ 🤖 AI Chatbot Integration\n` +
            `│ ⚡ 24/7 Active System\n` +
            `╰──────────────────────────────────\n\n` +
            
            `╭━「 💡 *QUICK LINKS* 」━━━━━━━━━━\n` +
            `│ ▸ .menu       → All Commands\n` +
            `│ ▸ .ghost on   → Enable Ghost\n` +
            `│ ▸ .ping       → Bot Speed\n` +
            `│ ▸ .uptime     → System Info\n` +
            `╰──────────────────────────────────\n\n` +
            
            `> _Follow the official channel for updates_ 👇\n\n` +
            
            `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮\n` +
            `┃  💎 _Built Different. Charged Up._ ┃\n` +
            `┃  ⚡ *POWERED BY NEXTY MINI* ⚡     ┃\n` +
            `╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;

        // ═══════════════════════════════════════════════════════
        //  SEND WITH CYBERPUNK IMAGE
        // ═══════════════════════════════════════════════════════
        try {
            return await sock.sendMessage(from, { 
                image: { url: 'https://files.catbox.moe/o0798k.png' }, 
                caption: ownerText 
            }, { quoted: msg });
        } catch (imgErr) {
            try {
                return await sock.sendMessage(from, { 
                    image: { url: settings.startimage }, 
                    caption: ownerText 
                }, { quoted: msg });
            } catch (e) {
                return await sock.sendMessage(from, { text: ownerText }, { quoted: msg });
            }
        }

    } catch (err) {
        console.error('[owner] Error:', err.message);
        try {
            await sock.sendMessage(from, { 
                text: `❌ *Owner Command Error*\n\n${err.message}` 
            }, { quoted: msg });
        } catch (e) {}
    }
}

// ═══════════════════════════════════════════════════════════
//  EXPORTS
// ═══════════════════════════════════════════════════════════
module.exports = ownerCommand;
