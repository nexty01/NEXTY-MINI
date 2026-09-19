/**
 * CloseTime Command — Close group after countdown
 * Usage: .closetime <duration>
 * Example: .closetime 7m, .closetime 3h, .closetime 1d
 */

module.exports = {
    name: 'closetime',
    aliases: ['ct', 'closeafter', 'gcclose'],
    description: 'Close group after a countdown timer',
    category: 'group',
    async execute({ sock, from, reply, args, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('⛔ You must be a group admin to use this command!');

        if (!args.length) {
            return reply(
                `🔒 *Close Time Command*\n\n` +
                `Usage: .closetime <duration>\n\n` +
                `Examples:\n` +
                `• .closetime 30s — 30 seconds\n` +
                `• .closetime 7m — 7 minutes\n` +
                `• .closetime 3h — 3 hours\n` +
                `• .closetime 2d — 2 days`
            );
        }

        const input = String(args[0]).toLowerCase();
        const match = input.match(/^(\d+)(s|m|h|d)$/);
        if (!match) {
            return reply('❌ Invalid format! Use: 30s, 7m, 3h, or 2d');
        }

        const value = parseInt(match[1], 10);
        const unit = match[2];
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const unitNames = { s: 'second(s)', m: 'minute(s)', h: 'hour(s)', d: 'day(s)' };
        const totalMs = value * multipliers[unit];

        if (totalMs <= 0) return reply('❌ Duration must be greater than zero.');
        if (totalMs > 30 * 86400000) return reply('❌ Maximum duration is 30 days!');

        const startTime = Date.now();
        const endTime = startTime + totalMs;

        const formatRemaining = (ms) => {
            if (ms <= 0) return '00:00:00';
            const hrs = Math.floor(ms / 3600000);
            const mins = Math.floor((ms % 3600000) / 60000);
            const secs = Math.floor((ms % 60000) / 1000);
            return `${String(hrs).padStart(2,'0')}:${String(mins).padStart(2,'0')}:${String(secs).padStart(2,'0')}`;
        };

        const makeBar = (pct) => {
            const total = 20;
            const filled = Math.max(0, Math.min(total, Math.round(pct * total)));
            return '▓'.repeat(filled) + '░'.repeat(total - filled);
        };

        const buildMsg = (remaining) => {
            const elapsed = totalMs - remaining;
            const pct = Math.min(Math.max(elapsed / totalMs, 0), 1);
            const bar = makeBar(pct);
            const pctText = Math.round(pct * 100);
            return (
                `🔒 *GROUP CLOSING COUNTDOWN*\n\n` +
                `⏱️ Duration: *${value} ${unitNames[unit]}*\n\n` +
                `┌─────────────────────────┐\n` +
                `│  ${bar}  │\n` +
                `│        ${pctText}% elapsed          │\n` +
                `└─────────────────────────┘\n\n` +
                `⏳ Remaining: *${formatRemaining(remaining)}*\n` +
                `🕐 Closes at: *${new Date(endTime).toLocaleTimeString()}*\n\n` +
                `_Group will be closed automatically..._`
            );
        };

        // Initial countdown message (best-effort)
        let key = null;
        try {
            const sent = await sock.sendMessage(from, { text: buildMsg(totalMs) });
            key = sent?.key || null;
        } catch (e) {
            console.error('[closetime] initial send failed:', e?.message);
        }

        // Periodic edit (cosmetic, ignore failures)
        let interval;
        if (totalMs <= 60000) interval = 5000;
        else if (totalMs <= 600000) interval = 30000;
        else if (totalMs <= 3600000) interval = 60000;
        else interval = 300000;

        const editTimer = setInterval(async () => {
            const remaining = endTime - Date.now();
            if (remaining <= 0) { clearInterval(editTimer); return; }
            if (!key) return;
            try {
                await sock.sendMessage(from, { text: buildMsg(remaining), edit: key });
            } catch (_) { /* WhatsApp can rate-limit edits; ignore */ }
        }, interval);

        // Authoritative close action — runs exactly once when timer fires
        setTimeout(async () => {
            clearInterval(editTimer);
            try {
                await sock.groupSettingUpdate(from, 'announcement');
                await sock.sendMessage(from, {
                    text: (
                        `🔒 *GROUP CLOSED*\n\n` +
                        `┌─────────────────────────┐\n` +
                        `│  ${'▓'.repeat(20)}  │\n` +
                        `│       100% complete        │\n` +
                        `└─────────────────────────┘\n\n` +
                        `✅ Timer finished! Group is now *closed*.\n` +
                        `Only admins can send messages.`
                    )
                });
            } catch (e) {
                console.error('[closetime] groupSettingUpdate failed:', e?.message);
                await sock.sendMessage(from, {
                    text: `❌ Failed to close the group automatically.\n\nReason: _${e?.message || 'unknown error'}_\n\nMake sure I am a group admin so I can change settings.`
                }).catch(() => {});
            }
        }, totalMs);
    }
};
