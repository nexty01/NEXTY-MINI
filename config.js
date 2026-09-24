'use strict';

// Central runtime configuration used by legacy and new command modules.
// Secrets are read only from environment variables; no credentials are stored here.
const settings = require('./settings');

const list = (value) => String(value || '')
    .split(',')
    .map(item => item.trim())
    .filter(Boolean);

const ownerName = process.env.OWNER_NAME || settings.ownerName || 'NEXTY';
const ownerNumber = process.env.OWNER_NUMBER || settings.ownerNumber || '';

module.exports = {
    owner: {
        name: ownerName,
        number: ownerNumber,
        channel: settings.whatsappChannel,
    },
    ownerName,
    ownerNumber,
    botName: process.env.BOT_NAME || settings.botName || 'NEXTY MINI 👀',
    version: process.env.BOT_VERSION || settings.version || '3.0.0',
    prefix: process.env.PREFIX || settings.prefix || '.',
    mode: process.env.BOT_MODE || 'private',
    enabled: true,
    reason: 'Not configured',
    unknownReason: '',
    pairingCode: process.env.PAIRING_CODE === 'true',
    pendingPhoneReject: [],
    whitelist: list(process.env.WHITELIST),
    blacklist: list(process.env.BLACKLIST),
    apiKeys: {
        imgbb: process.env.IMGBB_API_KEY || '',
        removebg: process.env.REMOVEBG_API_KEY || '',
        klipy: process.env.KLIPY_API_KEY || '',
        tenor: process.env.TENOR_API_KEY || '',
        omdb: process.env.OMDB_API_KEY || '',
        alya: process.env.ALYA_API_KEY || '',
    },
    antiBan: process.env.ANTI_BAN !== 'false',
    antibot: process.env.ANTIBOT === 'true',
    antibotAction: process.env.ANTIBOT_ACTION || 'warn',
    antibotMode: process.env.ANTIBOT_MODE || 'warn',
    antibotMaxWarnings: Number(process.env.ANTIBOT_MAX_WARNINGS || 3),
    guard: false,
    guardQuestion: 'Are you human?',
    guardOptions: ['I am human', 'I am a robot'],
    guardCorrect: 0,
    sessions: {
        folder: process.env.SESSION_FOLDER || 'session',
        autoReconnect: process.env.AUTO_RECONNECT !== 'false',
    },
    schedule: {
        enabled: false,
        type: 'daily',
        start: '09:00',
        end: '22:00',
        days: [],
        dates: [],
        months: [],
    },
    connectedBots: settings.connectedBots || [],
    premiumUsers: settings.premiumUsers || [],
};
