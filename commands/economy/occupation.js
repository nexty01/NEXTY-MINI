/**
 * Occupation — pick a job. Affects how often you get sick and your salary.
 * Usage:
 *   .occupation              -> list jobs
 *   .occupation <id>         -> set job
 */
const { health, OCCUPATIONS } = require('../../utils/healthManager');

module.exports = {
    name: 'occupation',
    aliases: ['job', 'career'],
    description: 'View or set your occupation',
    category: 'economy',
    async execute({ sock, msg, from, sender, args, reply }) {
        if (!args.length) {
            const list = Object.entries(OCCUPATIONS)
                .map(([id, o]) => `• \`${id}\` — ${o.name} · 💵 ${o.salary}/work · risk ${(o.sickChance * 100).toFixed(0)}%`)
                .join('\n');
            return reply(
                `💼 *Occupations*\n\n${list}\n\n` +
                `_Use_ *.occupation <id>* _to choose one._`
            );
        }
        const choice = args[0].toLowerCase();
        const res = health.setOccupation(sender, choice);
        if (!res.ok) return reply(`❌ ${res.reason}`);
        await reply(`✅ You are now a *${res.occupation.name}*. Salary: 💵 ${res.occupation.salary}/work.`);
    }
};
