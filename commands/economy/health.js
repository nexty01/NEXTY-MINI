/**
 * Health — Sukuna-themed canvas health card with text fallback.
 * Mirrors the .bal flow: try the canvas render, fall back to plain text.
 */
const { health, SICKNESSES, OCCUPATIONS, DRUGS } = require('../../utils/healthManager');

let renderHealthCard = null;
try { ({ renderHealthCard } = require('../../utils/canvasRender')); } catch (_) {}

function bar(hp) {
    const filled = Math.round(hp / 10);
    return '█'.repeat(filled) + '░'.repeat(10 - filled);
}

module.exports = {
    name: 'health',
    aliases: ['hp', 'status'],
    description: 'Check your health, sickness and drugs',
    category: 'economy',

    async execute({ sock, msg, from, sender, reply }) {
        const u = health.getStatus(sender);
        const sick = u.sickness ? SICKNESSES[u.sickness] : null;
        const occ  = u.occupation ? OCCUPATIONS[u.occupation] : null;

        const drugList = Object.entries(u.drugs || {}).map(([id, q]) => ({
            id,
            name: DRUGS[id]?.name || id,
            qty: q,
        }));

        const drugText = drugList.length
            ? drugList.map(d => `   • ${d.name} ×${d.qty}`).join('\n')
            : '   _none_';

        const num = sender.split('@')[0].split(':')[0];
        const text =
            `🩺 *Health Report* — @${num}\n` +
            `━━━━━━━━━━━━━━━━━━━━\n` +
            `❤️ HP   : ${u.health}/100  [${bar(u.health)}]\n` +
            `🤒 Status: ${sick ? `${sick.emoji} ${sick.name}` : '✅ Healthy'}\n` +
            `💼 Job   : ${occ ? occ.name : '_unemployed — set with .occupation_'}\n\n` +
            `💊 *Medicine cabinet*\n${drugText}\n\n` +
            `_Use_ *.drugs* _to view & buy_, _use_ *.use <drug>* _to take one._`;

        if (renderHealthCard) {
            try {
                const buf = await renderHealthCard({
                    name: num,
                    hp: u.health,
                    sickness: sick,
                    occupation: occ,
                    drugs: drugList,
                });
                await sock.sendMessage(from, {
                    image: buf,
                    caption: text,
                    mentions: [sender],
                }, { quoted: msg });
                return;
            } catch (e) {
                console.error('[health:render]', e.message);
            }
        }

        await sock.sendMessage(from, { text, mentions: [sender] }, { quoted: msg });
    },
};
