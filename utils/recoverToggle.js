'use strict';
/**
 * Shared factory for .antidelete / .antiedit / .antistatus.
 *
 *   .antidelete on|off        owner/sudo → bot-wide: personal chats + groups (+ statuses via .antistatus),
 *                             alerts arrive in YOUR inbox
 *   .antidelete group on|off  owner/sudo/group-admin → this group only (alert posted in the group,
 *                             or in your inbox while private mode is on)
 *   .antidelete status        show both switches
 *   .antidelete               toggle (same scope rules)
 */
const database = require('./database');

const isPrivileged = (ctx) => ctx.isRealOwner === true || ctx.isSudo === true || (ctx.isRealOwner === undefined && ctx.isOwner === true);
const ONOFF = { on: true, enable: true, '1': true, true: true, off: false, disable: false, '0': false, false: false };

function createRecoverCommand({ name, aliases, description, title, emoji, globalKey, groupKey, what }) {
    return {
        name, aliases, description, usage: `.${name} on|off|status  (owner: everywhere → your inbox)  |  .${name} group on|off`,
        category: 'moderation',

        async execute(ctx) {
            const { reply, args = [], from, isGroup, isAdmin, phoneNumber } = ctx;
            const priv = isPrivileged(ctx);
            const words = args.map(a => String(a).toLowerCase());
            const wantsGroup = words.includes('group') || words.includes('here');
            const wantsGlobal = words.includes('all') || words.includes('global') || words.includes('inbox');
            const action = words.find(w => w in ONOFF || w === 'status' || w === 'toggle');

            const scope = wantsGroup ? 'group' : (wantsGlobal ? 'global' : (priv ? 'global' : 'group'));
            const rec = () => database.getGroup(phoneNumber) || {};
            const grp = () => (isGroup ? (database.getGroup(from) || {}) : {});

            if (action === 'status') {
                return reply(
                    `${emoji} *${title}*\n\n` +
                    `📥 Everywhere (personal + groups → your inbox): *${rec()[globalKey] ? 'ON ✅' : 'OFF ❌'}*\n` +
                    (groupKey ? `👥 This group: *${isGroup ? (grp()[groupKey] ? 'ON ✅' : 'OFF ❌') : 'n/a (not a group)'}*\n` : '') +
                    `\nUse *.${name} on* / *.${name} off*` + (groupKey ? ` — or *.${name} group on|off*` : '')
                );
            }

            if (scope === 'global') {
                if (!priv) return reply('🔒 *Only the bot owner can switch this on for all chats.*' + (groupKey ? `\nGroup admins can use *.${name} group on|off* inside their group.` : ''));
                const current = !!rec()[globalKey];
                const next = action && action !== 'toggle' ? ONOFF[action] : !current;
                database.setGroup(phoneNumber, globalKey, next);
                if (!!(database.getGroup(phoneNumber) || {})[globalKey] !== next) return reply('❌ Could not save this setting. Nothing was changed.');
                return reply(
                    `${emoji} *${title}*\n\n` +
                    (next
                        ? `✅ *ON everywhere* — ${what} in personal chats${groupKey ? ' and groups' : ''} will be sent to your *inbox*.`
                        : `❌ *OFF* — bot-wide ${title.toLowerCase()} is disabled.`) +
                    `\n\n> _Nexty Mini_`
                );
            }

            // group scope
            if (!groupKey) return reply('ℹ️ This feature is bot-wide only. Use *.' + name + ' on|off*.');
            if (!isGroup) return reply('👥 Use this inside a group, or use *.' + name + ' on* (owner) for all chats.');
            if (!isAdmin && !priv) return reply('🛡️ *Admin Only!*\n\n❌ You must be a group admin to use this command.');
            const current = !!grp()[groupKey];
            const next = action && action !== 'toggle' ? ONOFF[action] : !current;
            database.setGroup(from, groupKey, next);
            if (!!(database.getGroup(from) || {})[groupKey] !== next) return reply('❌ Could not save this setting. Nothing was changed.');
            return reply(
                `${emoji} *${title}* (this group)\n\n` +
                (next ? `✅ *ON* — ${what} in this group will be shown here (or in the owner's inbox while the bot is private).` : `❌ *OFF* for this group.`) +
                `\n\n> _Nexty Mini_`
            );
        },
    };
}

module.exports = { createRecoverCommand, isPrivileged };
