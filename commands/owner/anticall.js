'use strict';

const {
    loadConfig,
    saveConfig,
    normalizeJid,
    findLidForPhone,
    defaultConfig
} = require('../../utils/anticallManager');

module.exports = {
    name: 'anticall',
    aliases: ['ac', 'callblock'],
    category: 'Owner',
    desc: 'Manage anti-call settings (whitelist/blacklist always active)',
    ownerOnly: true,

    execute: async (context) => {
        try {
            const { args, reply } = context;
            
            if (!reply) {
                return console.error('[anticall] No reply function');
            }

            const sub = (args[0] || '').toLowerCase();
            const config = loadConfig();

            if (!config.pendingPhoneReject) {
                config.pendingPhoneReject = [];
            }

            // Convert phone or JID to proper JID format
            const toJid = (input) => {
                if (!input) return '';
                const trimmed = input.trim();
                
                // Pure phone number
                if (/^\d+$/.test(trimmed)) {
                    const lid = findLidForPhone(trimmed);
                    if (lid) {
                        console.log(`[anticall] Found LID for ${trimmed}: ${lid}`);
                        return lid;
                    }
                    console.log(`[anticall] No LID for ${trimmed}, using phone JID`);
                    return `${trimmed}@s.whatsapp.net`;
                }
                return trimmed;
            };

            // HELP
            if (!sub) {
                return reply(
                    `Anti-Call Manager\n\n` +
                    `Whitelist & Blacklist always active.\n` +
                    `Global ON/OFF controls unknown callers.\n\n` +
                    `Commands:\n` +
                    `.anticall on/off\n` +
                    `.anticall reason <text>\n` +
                    `.anticall unknownreason <text>\n` +
                    `.anticall schedule once <start ISO> <end ISO>\n` +
                    `.anticall schedule always <start HH:MM> <end HH:MM> [days] [dates] [months]\n` +
                    `.anticall schedule off\n` +
                    `.anticall reject add/remove/list <number or JID>\n` +
                    `.anticall whitelist add/remove/list <number or JID>\n` +
                    `.anticall status\n` +
                    `.anticall reset`,
                    { raw: true }
                );
            }

            // ON / OFF
            if (sub === 'on') {
                config.enabled = true;
                saveConfig(config);
                return reply('Anti-call globally ENABLED');
            }

            if (sub === 'off') {
                config.enabled = false;
                saveConfig(config);
                return reply('Anti-call globally DISABLED');
            }

            // REASON for blocked calls
            if (sub === 'reason') {
                const reason = args.slice(1).join(' ');
                if (!reason) return reply('Provide a rejection message');
                
                config.reason = reason;
                saveConfig(config);
                return reply(`Blocked caller reason set to:\n${reason}`);
            }

            // UNKNOWN REASON for unknown callers
            if (sub === 'unknownreason') {
                const text = args.slice(1).join(' ');
                if (!text) return reply('Provide a message for unknown callers');
                
                config.unknownReason = text;
                saveConfig(config);
                return reply(`Unknown caller reason set to:\n${text}`);
            }

            // SCHEDULE management
            if (sub === 'schedule') {
                const action = (args[1] || '').toLowerCase();

                if (action === 'off') {
                    config.schedule.enabled = false;
                    saveConfig(config);
                    return reply('Schedule disabled');
                }

                if (action === 'once') {
                    const start = args[2];
                    const end = args[3];
                    if (!start || !end) {
                        return reply('Usage: .anticall schedule once <start ISO> <end ISO>');
                    }

                    config.schedule.enabled = true;
                    config.schedule.type = 'once';
                    config.schedule.start = start;
                    config.schedule.end = end;
                    saveConfig(config);
                    return reply(`One-time schedule:\n${start} → ${end}`);
                }

                if (action === 'always') {
                    const start = args[2];
                    const end = args[3];
                    if (!start || !end) {
                        return reply('Usage: .anticall schedule always <start HH:MM> <end HH:MM> [days] [dates] [months]');
                    }

                    config.schedule.enabled = true;
                    config.schedule.type = 'always';
                    config.schedule.start = start;
                    config.schedule.end = end;
                    config.schedule.days = args[4] ? args[4].split(',').map(Number).filter(n => !isNaN(n)) : [];
                    config.schedule.dates = args[5] ? args[5].split(',').map(Number).filter(n => !isNaN(n)) : [];
                    config.schedule.months = args[6] ? args[6].split(',').map(Number).filter(n => !isNaN(n)) : [];
                    saveConfig(config);

                    return reply(
                        `Recurring schedule:\n` +
                        `${start} → ${end}\n` +
                        `Days: ${config.schedule.days.length ? config.schedule.days.join(',') : 'All'}\n` +
                        `Dates: ${config.schedule.dates.length ? config.schedule.dates.join(',') : 'All'}\n` +
                        `Months: ${config.schedule.months.length ? config.schedule.months.join(',') : 'All'}`
                    );
                }

                return reply('Invalid schedule action. Use: on/off/once/always');
            }

            // REJECT (Blacklist)
            if (sub === 'reject') {
                const action = (args[1] || '').toLowerCase();
                const target = args.slice(2).join(' ').trim();

                if (action === 'add') {
                    const jid = toJid(target);
                    if (!jid) return reply('Provide a phone number or JID');

                    if (!config.blacklist.includes(jid)) {
                        config.blacklist.push(jid);
                    }

                    // Track pending phone numbers for LID upgrade
                    if (/^\d+$/.test(target) && !jid.includes('@lid')) {
                        if (!config.pendingPhoneReject.includes(target)) {
                            config.pendingPhoneReject.push(target);
                        }
                        saveConfig(config);
                        return reply(`Added ${jid} to reject list.\nLID pending upgrade on first call`);
                    }

                    saveConfig(config);
                    return reply(`Added ${jid} to reject list`);
                }

                if (action === 'remove') {
                    const jid = toJid(target);
                    if (!jid) return reply('Provide a phone number or JID');

                    config.blacklist = config.blacklist.filter(b => normalizeJid(b) !== normalizeJid(jid));
                    
                    if (/^\d+$/.test(target)) {
                        config.pendingPhoneReject = config.pendingPhoneReject.filter(p => p !== target);
                    }

                    saveConfig(config);
                    return reply(`Removed ${jid} from reject list`);
                }

                if (action === 'list') {
                    const list = config.blacklist.length ? config.blacklist.join('\n') : '(empty)';
                    const pending = config.pendingPhoneReject?.length ? config.pendingPhoneReject.join('\n') : '(none)';
                    
                    return reply(
                        `Blacklist:\n${list}\n\n` +
                        `Pending LID upgrades:\n${pending}`
                    );
                }

                return reply('Usage: .anticall reject add/remove/list <number or JID>');
            }

            // WHITELIST
            if (sub === 'whitelist') {
                const action = (args[1] || '').toLowerCase();
                const target = args.slice(2).join(' ').trim();

                if (!action || action === 'list') {
                    const list = config.whitelist.length ? config.whitelist.join('\n') : '(empty)';
                    return reply(`Whitelist (always allowed):\n${list}`);
                }

                if (action === 'add') {
                    const jid = toJid(target);
                    if (!jid) return reply('Provide a phone number or JID');

                    if (!config.whitelist.includes(jid)) {
                        config.whitelist.push(jid);
                        saveConfig(config);
                    }

                    return reply(`Added ${jid} to whitelist (never rejected)`);
                }

                if (action === 'remove') {
                    const jid = toJid(target);
                    if (!jid) return reply('Provide a phone number or JID');

                    config.whitelist = config.whitelist.filter(w => normalizeJid(w) !== normalizeJid(jid));
                    saveConfig(config);
                    return reply(`Removed ${jid} from whitelist`);
                }

                return reply('Usage: .anticall whitelist add/remove/list <number or JID>');
            }

            // STATUS
            if (sub === 'status') {
                const s = config.schedule;
                let scheduleInfo = s.enabled
                    ? `${s.type.toUpperCase()}: ${s.start} → ${s.end}`
                    : 'Disabled';

                if (s.enabled && s.type === 'always') {
                    scheduleInfo += `\nDays: ${s.days.length ? s.days.join(',') : 'All'}`;
                    scheduleInfo += `\nDates: ${s.dates.length ? s.dates.join(',') : 'All'}`;
                    scheduleInfo += `\nMonths: ${s.months.length ? s.months.join(',') : 'All'}`;
                }

                return reply(
                    `Anti-Call Status\n` +
                    `Global: ${config.enabled ? 'ON' : 'OFF'}\n` +
                    `Schedule: ${scheduleInfo}\n\n` +
                    `Whitelist: ${config.whitelist.length} entries\n` +
                    `Blacklist: ${config.blacklist.length} entries\n` +
                    `Pending LID: ${config.pendingPhoneReject?.length || 0}\n\n` +
                    `Blocked reason: ${config.reason}\n` +
                    `Unknown reason: ${config.unknownReason || '(not set)'}`
                );
            }

            // RESET
            if (sub === 'reset') {
                saveConfig(defaultConfig);
                return reply('Anti-call reset to defaults');
            }

            return reply('Unknown subcommand. Use .anticall for help');

        } catch (err) {
            console.error('[anticall]', err.message);
            context?.reply?.('Anti-call error');
        }
    }
};
