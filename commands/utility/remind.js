/**
 * Remind Command — Set personal reminders
 * Usage: .remind <duration> <message>
 * Example: .remind 30m Take medicine
 */

const activeReminders = new Map();

module.exports = {
    name: 'remind',
    aliases: ['reminder', 'remindme', 'alarm'],
    description: 'Set a personal reminder that pings you after a duration',
    category: 'utility',
    async execute({ sock, from, reply, args, sender }) {
        if (!args.length) {
            const userKey = sender;
            const userReminders = [];
            for (const [id, r] of activeReminders) {
                if (r.sender === userKey) userReminders.push({ id, ...r });
            }

            let list = '_No active reminders._';
            if (userReminders.length) {
                list = userReminders.map((r, i) => {
                    const remaining = r.endTime - Date.now();
                    const mins = Math.max(0, Math.ceil(remaining / 60000));
                    return `${i + 1}. ⏳ *${mins}m left* — ${r.message}`;
                }).join('\n');
            }

            return reply(
                `╔══════════════════════════╗\n` +
                `║  ⏰ *REMINDER SYSTEM*     ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Set a reminder and get pinged when\n` +
                `the time is up!\n\n` +
                `🔧 *USAGE*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `▸ .remind 30m Take medicine\n` +
                `▸ .remind 2h Call dentist\n` +
                `▸ .remind 1d Pay rent\n` +
                `▸ .remind 45s Check oven\n` +
                `▸ .remind list — View active\n` +
                `▸ .remind clear — Cancel all\n\n` +
                `⏱️ *FORMATS*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `s = seconds │ m = minutes\n` +
                `h = hours   │ d = days\n\n` +
                `📋 *YOUR REMINDERS*\n` +
                `━━━━━━━━━━━━━━━━━━━━━\n` +
                `${list}`
            );
        }

        // ── List ──
        if (args[0].toLowerCase() === 'list') {
            const userReminders = [];
            for (const [id, r] of activeReminders) {
                if (r.sender === sender) userReminders.push({ id, ...r });
            }

            if (!userReminders.length) {
                return reply(
                    `╔══════════════════════════╗\n` +
                    `║  📋 *YOUR REMINDERS*      ║\n` +
                    `╚══════════════════════════╝\n\n` +
                    `_You have no active reminders._\n\n` +
                    `Use .remind <time> <message> to set one!`
                );
            }

            const list = userReminders.map((r, i) => {
                const remaining = r.endTime - Date.now();
                const hrs = Math.floor(remaining / 3600000);
                const mins = Math.floor((remaining % 3600000) / 60000);
                const secs = Math.floor((remaining % 60000) / 1000);
                const timeStr = hrs > 0 ? `${hrs}h ${mins}m` : mins > 0 ? `${mins}m ${secs}s` : `${secs}s`;
                const pct = Math.min((Date.now() - r.startTime) / (r.endTime - r.startTime), 1);
                const filled = Math.round(pct * 10);
                const bar = '▓'.repeat(filled) + '░'.repeat(10 - filled);
                return `${i + 1}. 📌 *${r.message}*\n   ⏳ ${timeStr} left [${bar}]`;
            }).join('\n\n');

            return reply(
                `╔══════════════════════════╗\n` +
                `║  📋 *YOUR REMINDERS*      ║\n` +
                `╚══════════════════════════╝\n\n` +
                `${list}\n\n` +
                `_Use .remind clear to cancel all._`
            );
        }

        // ── Clear ──
        if (args[0].toLowerCase() === 'clear') {
            let count = 0;
            for (const [id, r] of activeReminders) {
                if (r.sender === sender) {
                    clearTimeout(r.timer);
                    activeReminders.delete(id);
                    count++;
                }
            }
            return reply(
                `╔══════════════════════════╗\n` +
                `║  🗑️ *REMINDERS CLEARED*   ║\n` +
                `╚══════════════════════════╝\n\n` +
                `Cancelled *${count}* reminder(s).\n\n` +
                `_All clean! Set new ones anytime._`
            );
        }

        // ── Parse duration ──
        const timeStr = args[0].toLowerCase();
        const match = timeStr.match(/^(\d+)(s|m|h|d)$/);
        if (!match) {
            return reply('❌ Invalid time format! Use: 30s, 5m, 2h, or 1d');
        }

        const value = parseInt(match[1]);
        const unit = match[2];
        const multipliers = { s: 1000, m: 60000, h: 3600000, d: 86400000 };
        const unitNames = { s: 'second(s)', m: 'minute(s)', h: 'hour(s)', d: 'day(s)' };
        const totalMs = value * multipliers[unit];

        if (totalMs > 7 * 86400000) {
            return reply('❌ Maximum reminder duration is 7 days!');
        }

        const message = args.slice(1).join(' ') || 'No reason specified';
        const reminderId = `${sender}_${Date.now()}`;
        const now = Date.now();
        const endTime = now + totalMs;

        // Set the timer
        const timer = setTimeout(async () => {
            activeReminders.delete(reminderId);
            try {
                await sock.sendMessage(from, {
                    text: (
                        `╔══════════════════════════╗\n` +
                        `║  🔔 *REMINDER ALERT!*     ║\n` +
                        `╚══════════════════════════╝\n\n` +
                        `┌─────────────────────────┐\n` +
                        `│ 📌 *${message}*\n` +
                        `│ ⏱️ Set: ${value} ${unitNames[unit]} ago\n` +
                        `│ 🕐 Time: ${new Date().toLocaleTimeString()}\n` +
                        `└─────────────────────────┘\n\n` +
                        `@${sender.split('@')[0]} ☝️ *Don't forget!*\n\n` +
                        `_Use .remind to set another._`
                    ),
                    mentions: [sender]
                });
            } catch (_) {}
        }, totalMs);

        activeReminders.set(reminderId, {
            sender,
            from,
            message,
            startTime: now,
            endTime,
            timer
        });

        const activeCount = [...activeReminders.values()].filter(r => r.sender === sender).length;
        const fireTime = new Date(endTime).toLocaleTimeString();

        reply(
            `╔══════════════════════════╗\n` +
            `║  ✅ *REMINDER SET!*       ║\n` +
            `╚══════════════════════════╝\n\n` +
            `┌─────────────────────────┐\n` +
            `│ 📌 *${message}*\n` +
            `│ ⏱️ Duration: *${value} ${unitNames[unit]}*\n` +
            `│ 🔔 Fires at: *${fireTime}*\n` +
            `│ 📊 Active: *${activeCount}* reminder(s)\n` +
            `└─────────────────────────┘\n\n` +
            `[░░░░░░░░░░░░░░░░░░░░] 0%\n\n` +
            `_I'll ping you when it's time!_`
        );
    }
};
