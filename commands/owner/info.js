/**
 * info — Fetch a user's WhatsApp profile (name, bio/about, profile picture).
 *
 * Usage:
 *   .info               (reply to a user's message)
 *   .info @user         (tag a user)
 *   .info               (no target → your own profile)
 *
 * Renders a styled card with the user's profile picture as image (if any),
 * caption containing name, number, bio and the official channel context.
 */

const CHANNEL_JID  = '120363424109748354@newsletter';
const CHANNEL_NAME = 'Sukuna MD Pasqua tech';

function buildChannelCtx() {
    return {
        isForwarded: true,
        forwardingScore: 999,
        forwardedNewsletterMessageInfo: {
            newsletterJid:   CHANNEL_JID,
            newsletterName:  CHANNEL_NAME,
            serverMessageId: 143,
        },
    };
}

module.exports = {
    name: 'info',
    aliases: ['userinfo', 'whois', 'profile'],
    description: "Fetch a user's profile: picture, name and bio/status",
    category: 'general',
    async execute({ sock, msg, from, sender, reply }) {
        try {
            // Resolve target: mention > reply > sender
            const ctx       = msg.message?.extendedTextMessage?.contextInfo;
            const mentioned = ctx?.mentionedJid?.[0];
            const replied   = ctx?.participant;
            const target    = mentioned || replied || sender;

            const number = target.split('@')[0].split(':')[0];

            // ── Profile picture ──
            let ppUrl = null;
            try { ppUrl = await sock.profilePictureUrl(target, 'image'); } catch (_) {}

            // ── Bio / About ──
            let bio = '';
            try {
                const s = await sock.fetchStatus(target);
                // Baileys may return { status, setAt } OR an array of { status }
                if (Array.isArray(s)) bio = s[0]?.status?.status || s[0]?.status || '';
                else bio = s?.status?.status || s?.status || '';
            } catch (_) {}
            if (!bio) bio = '_No bio set_';

            // ── Display name ──
            let name = '';
            try {
                const [c] = await sock.onWhatsApp(target).catch(() => []);
                name = c?.notify || '';
            } catch (_) {}
            if (!name) {
                name = msg.pushName && target === sender ? msg.pushName : `+${number}`;
            }

            // ── Business profile (if any) ──
            let business = null;
            try { business = await sock.getBusinessProfile(target); } catch (_) {}

            const isBusiness = !!business?.description || !!business?.email || !!business?.website;

            const lines = [
                `╔══════════════════════════╗`,
                `║   👤 *USER PROFILE INFO*   ║`,
                `╚══════════════════════════╝`,
                ``,
                `┌─────────────────────────`,
                `│ 🪪  *Name:* ${name}`,
                `│ 📱  *Number:* +${number}`,
                `│ 🏷️  *JID:* \`${target}\``,
                `│ 💬  *Bio:* ${bio}`,
                isBusiness ? `│ 💼  *Account:* Business` : `│ 💼  *Account:* Personal`,
            ];
            if (business?.description) lines.push(`│ 📝  *About:* ${business.description}`);
            if (business?.email)       lines.push(`│ 📧  *Email:* ${business.email}`);
            if (business?.website?.length) lines.push(`│ 🌐  *Web:* ${business.website[0]}`);
            if (business?.category)    lines.push(`│ 🗂️  *Category:* ${business.category}`);
            lines.push(`└─────────────────────────`);
            lines.push('');
            lines.push(`> _Powered by ${CHANNEL_NAME}_`);

            const caption = lines.join('\n');
            const contextInfo = { mentions: [target], ...buildChannelCtx() };

            if (ppUrl) {
                await sock.sendMessage(from, {
                    image: { url: ppUrl },
                    caption,
                    contextInfo,
                }, { quoted: msg });
            } else {
                await sock.sendMessage(from, {
                    text: `🚫 _No profile picture set._\n\n` + caption,
                    contextInfo,
                }, { quoted: msg });
            }
        } catch (err) {
            console.error('[INFO]', err);
            return reply(`❌ Failed to fetch info: ${err.message}`);
        }
    },
};
