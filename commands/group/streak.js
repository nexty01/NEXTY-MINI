/**
 * Streak Command — Track daily participation streak
 * Usage: .streak | .streak check
 */
const database = require('../../utils/database');
module.exports = {
    name: 'streak',
    aliases: ['checkin', 'daily_streak'],
    description: 'Check in daily to build your activity streak',
    category: 'group',
    async execute({ reply, sender, from }) {
        const key = `streak_${from}_${sender}`;
        const data = database.getGroupData(from, key) || { streak: 0, lastCheckin: 0 };
        const now = Date.now();
        const oneDayMs = 86400000;
        const diff = now - data.lastCheckin;
        if (diff < oneDayMs) {
            const remaining = oneDayMs - diff;
            const h = Math.floor(remaining/3600000), m = Math.floor((remaining%3600000)/60000);
            return reply(`⏰ You already checked in today!\n\n🔥 Current Streak: *${data.streak} day(s)*\n\nCome back in *${h}h ${m}m*!`);
        }
        if (diff > oneDayMs * 2) data.streak = 0; // reset if missed a day
        data.streak += 1;
        data.lastCheckin = now;
        database.setGroupData(from, key, data);
        const emoji = data.streak >= 30 ? '🏆' : data.streak >= 14 ? '🥇' : data.streak >= 7 ? '🔥' : '✅';
        reply(`${emoji} *Daily Check-in!*\n\n@${sender.split('@')[0]}\n🔥 Streak: *${data.streak} day(s)*\n\n${data.streak >= 7 ? '🔥 You\'re on fire! Keep it up!' : 'Keep checking in daily!'}`, { mentions: [sender] });
    }
};
