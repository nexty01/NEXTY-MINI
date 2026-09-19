/**
 * Drugs — pharmacy. List, buy and use drugs to cure sicknesses.
 * Usage:
 *   .drugs                       -> list available drugs
 *   .drugs buy <id> [qty]        -> buy a drug
 *   .drugs use <id>              -> consume a drug from your stash
 */
const { health, DRUGS, SICKNESSES } = require('../../utils/healthManager');
const { economy, CURRENCY } = require('../../utils/economyManager');

module.exports = {
    name: 'drugs',
    aliases: ['pharmacy', 'meds'],
    description: 'Buy & use drugs to cure sicknesses',
    category: 'economy',
    async execute({ sock, msg, from, sender, args, reply }) {
        const sub = (args[0] || '').toLowerCase();

        if (!sub || sub === 'list') {
            const list = Object.entries(DRUGS)
                .map(([id, d]) => `• \`${id}\` — ${d.name} · 💵 ${d.price}\n   _${d.desc}_`)
                .join('\n\n');
            const sickList = Object.entries(SICKNESSES)
                .map(([id, s]) => `   ${s.emoji} ${s.name} — cured by: ${s.cure.join(', ')}`)
                .join('\n');
            return reply(
                `💊 *Pharmacy*\n\n${list}\n\n` +
                `🤒 *Known sicknesses*\n${sickList}\n\n` +
                `_Buy:_ *.drugs buy <id> [qty]*\n_Use:_ *.drugs use <id>*`
            );
        }

        if (sub === 'buy') {
            const id  = (args[1] || '').toLowerCase();
            const qty = parseInt(args[2], 10) || 1;
            if (!id) return reply('Usage: *.drugs buy <id> [qty]*');
            const r = health.buyDrug(sender, id, qty, economy);
            if (!r.ok) return reply(`❌ ${r.reason}`);
            return reply(`✅ Bought *${r.drug.name}* ×${r.qty} for 💵 ${r.cost.toLocaleString()} ${CURRENCY}.`);
        }

        if (sub === 'use') {
            const id = (args[1] || '').toLowerCase();
            if (!id) return reply('Usage: *.drugs use <id>*');
            const r = health.useDrug(sender, id);
            if (!r.ok) return reply(`❌ ${r.reason}`);
            const tail = r.cured
                ? `🎉 You feel better! HP is now ${r.health}/100.`
                : (r.sickness
                    ? `😬 No effect on your current sickness. HP: ${r.health}/100.`
                    : `🙂 HP: ${r.health}/100.`);
            return reply(`💊 You took *${r.drug.name}*.\n${tail}`);
        }

        return reply('Unknown action. Use *.drugs*, *.drugs buy <id>* or *.drugs use <id>*.');
    }
};
