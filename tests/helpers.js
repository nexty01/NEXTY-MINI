'use strict';
// Test harness: isolated data dir + stubs for npm packages that are not installed
// in the sandbox (Baileys, sharp, puppeteer …). Nothing here touches the network.
const fs = require('fs');
const os = require('os');
const path = require('path');
const Module = require('module');

const ROOT = path.join(__dirname, '..');
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'nexty-test-'));
process.env.NEXTY_DATA_DIR = path.join(TMP, 'data');
process.env.OWNER_NUMBER = '15550000001';
delete process.env.BOT_MODE;

function makeStub() {
    const fn = function () {};
    const stub = new Proxy(fn, {
        get: (t, p) => (p === '__esModule' ? false : p === Symbol.toPrimitive ? () => '' : p === 'then' ? undefined : stub),
        apply: () => stub,
        construct: () => stub,
    });
    return stub;
}
const realLoad = Module._load;
Module._load = function (request, parent, isMain) {
    try {
        return realLoad.apply(this, arguments);
    } catch (error) {
        if (error && error.code === 'MODULE_NOT_FOUND' && !request.startsWith('.') && !path.isAbsolute(request)) {
            return makeStub();
        }
        throw error;
    }
};

function freshRequire(rel) {
    const full = path.join(ROOT, rel);
    for (const k of Object.keys(require.cache)) if (k.startsWith(ROOT) && !k.includes('/tests/')) delete require.cache[k];
    return require(full);
}
// Simulate a bot restart: drop every project module from the cache, keep the data dir.
function restart() {
    for (const k of Object.keys(require.cache)) if (k.startsWith(ROOT) && !k.includes('/tests/')) delete require.cache[k];
}
function resetData() {
    fs.rmSync(process.env.NEXTY_DATA_DIR, { recursive: true, force: true });
    restart();
}

const BOT = '15550000001';           // paired bot number == owner
function makeSock(participants = []) {
    const sent = [];
    const handlers = {};
    const sock = {
        user: { id: `${BOT}:12@s.whatsapp.net` },
        sent, handlers,
        ev: { on: (evt, fn) => { (handlers[evt] = handlers[evt] || []).push(fn); }, off() {} },
        sendMessage: async (jid, content, opts) => { sent.push({ jid, content, opts }); return { key: { id: 'X' } }; },
        sendPresenceUpdate: async (...a) => { sent.push({ presence: a }); },
        readMessages: async (...a) => { sent.push({ read: a }); },
        groupMetadata: async (jid) => ({ id: jid, subject: 'Test', participants }),
        groupSettingUpdate: async () => {},
        groupParticipantsUpdate: async () => {},
        profilePictureUrl: async () => null,
        onWhatsApp: async () => [],
    };
    return sock;
}
let counter = 0;
function textMsg({ from, sender, text, fromMe = false, extra = {} }) {
    counter += 1;
    const isGroup = from.endsWith('@g.us');
    return {
        key: { remoteJid: from, fromMe, id: `MSG${Date.now()}${counter}`, ...(isGroup && !fromMe ? { participant: sender } : {}) },
        pushName: 'Tester',
        message: { conversation: text, ...extra },
        messageTimestamp: Math.floor(Date.now() / 1000),
    };
}
const wait = (ms = 30) => new Promise(r => setTimeout(r, ms));

module.exports = { ROOT, TMP, BOT, freshRequire, restart, resetData, makeSock, textMsg, wait };
