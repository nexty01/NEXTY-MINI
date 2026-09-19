/**
 * OpenTime Command — Open group after countdown
 * Usage: .opentime <duration>
 * Example: .opentime 5m, .opentime 3h, .opentime 16d
 */

module.exports = {
    name: 'opentime',
    aliases: ['ot', 'openafter', 'gcopen'],
    description: 'Open group after a countdown timer',
    category: 'group',
    async execute({ sock, from, reply, args, isGroup, isAdmin }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        if (!isAdmin) return reply('⛔ You must be a group admin to use this command!');

        if (!args.length) {
            return reply(
                `🔓 *Open Time Command*\n\n` +
                `Usage: .opentime <duration>\n\n` +
                `Examples:\n` +
                `• .opentime 30s — 30 seconds\n` +
                `• .opentime 5m — 5 minutes\n` +
                `• .opentime 3h — 3 hours\n` +
                `• .opentime 16d — 16 days`
            );
        }

        const input = String(args[0]).toLowerCase();
        const match = input.match(/^(\d+)(s|m|h|d)$/);
        if (!match) {
            return reply('❌ Invalid format! Use: 30s, 5m, 3h, or 16d');
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
                `🔓 *GROUP OPENING COUNTDOWN*\n\n` +
                `⏱️ Duration: *${value} ${unitNames[unit]}*\n\n` +
                `┌─────────────────────────┐\n` +
                `│  ${bar}  │\n` +
                `│        ${pctText}% elapsed          │\n` +
                `└─────────────────────────┘\n\n` +
                `⏳ Remaining: *${formatRemaining(remaining)}*\n` +
                `🕐 Opens at: *${new Date(endTime).toLocaleTimeString()}*\n\n` +
                `_Group will be opened automatically..._`
            );
        };

        let key = null;
        try {
            const sent = await sock.sendMessage(from, { text: buildMsg(totalMs) });
            key = sent?.key || null;
        } catch (e) {
            console.error('[opentime] initial send failed:', e?.message);
        }

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
            } catch (_) { /* ignore edit failures */ }
        }, interval);

        setTimeout(async () => {
            clearInterval(editTimer);
            try {
                await sock.groupSettingUpdate(from, 'not_announcement');
                await sock.sendMessage(from, {
                    text: (
                        `🔓 *GROUP OPENED*\n\n` +
                        `┌─────────────────────────┐\n` +
                        `│  ${'▓'.repeat(20)}  │\n` +
                        `│       100% complete        │\n` +
                        `└─────────────────────────┘\n\n` +
                        `✅ Timer finished! Group is now *open*.\n` +
                        `All members can send messages.`
                    )
                });
            } catch (e) {
                console.error('[opentime] groupSettingUpdate failed:', e?.message);
                await sock.sendMessage(from, {
                    text: `❌ Failed to open the group automatically.\n\nReason: _${e?.message || 'unknown error'}_\n\nMake sure I am a group admin so I can change settings.`
                }).catch(() => {});
            }
        }, totalMs);
    }
};
