/**
 * AntiHijack Command — Sukuna MD admin protection
 * Usage: .antihijack on | off | status
 *
 * Robust + fast: cached group metadata, parallel reversals, retry with backoff,
 * loop guard, owner/sudo allowlist. The actual reversal logic lives in
 * lib/promotionGuard.js → handleParticipantUpdate().
 */

const { updateGroupConfig, getGroupConfig, setupPromotionGuard } = require('../../lib/promotionGuard');
const database = require('../../utils/database');

function boldItalic(str) {
    const upperBase = 0x1D63C, lowerBase = 0x1D656;
    let out = '';
    for (const ch of str) {
        const c = ch.codePointAt(0);
        if (c >= 0x41 && c <= 0x5A) out += String.fromCodePoint(upperBase + (c - 0x41));
        else if (c >= 0x61 && c <= 0x7A) out += String.fromCodePoint(lowerBase + (c - 0x61));
        else out += ch;
    }
    return out;
}

module.exports = {
    name: 'antihijack',
    aliases: ['adminguard'],
    description: 'Protect admin hierarchy — auto-reverse unauthorized promote/demote',
    category: 'admin',

    async execute(context) {
        try {
            const { sock, msg: m, reply, args } = context;
            const groupId = m.chat;
            if (!groupId.endsWith('@g.us')) return reply('Group only');

            const action = (args[0] || '').toLowerCase();
            const settings = getGroupConfig(groupId);
            const on = settings.antipromote || settings.antidemote;

            if (!['on','off','status'].includes(action)) {
                return reply(`AntiHijack: ${on ? 'ON ✅' : 'OFF ❌'}\n\nUsage:\n.antihijack on\n.antihijack off\n.antihijack status`);
            }

            if (action === 'status') {
                return reply(on ? `✅ AntiHijack is ON` : `❌ AntiHijack is OFF`);
            }

            if (action === 'on') {
                updateGroupConfig(groupId, { antipromote: true, antidemote: true });
                setupPromotionGuard(sock);
                return reply('✅ AntiHijack enabled');
            }

            updateGroupConfig(groupId, { antipromote: false, antidemote: false });
            return reply('❌ AntiHijack disabled');
        } catch (err) {
            console.error('[antihijack]', err.message);
            return context.reply(`Error: ${err.message}`);
        }
    }
};
