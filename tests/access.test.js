'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const h = require('./helpers');
// modules start unref-less timers (mute cleanup, rate limiters); make sure the runner can exit
test.after(() => { setTimeout(() => process.exit(process.exitCode || 0), 50).unref(); });

const GROUP = '120363000000000001@g.us';
const OWNER = `${h.BOT}@s.whatsapp.net`;
const MOD = '15550000002@s.whatsapp.net';
const SUDO = '15550000003@s.whatsapp.net';
const ADMIN = '15550000004@s.whatsapp.net';
const NORMAL = '15550000009@s.whatsapp.net';

function load() {
    h.restart();
    const sm = require('../lib/sessionManager');
    const db = require('../utils/database');
    const access = require('../lib/access');
    const loader = require('../utils/commandLoader');
    if (!loader.getAll().length) loader.loadCommands();
    return { sm, db, access, loader };
}
const participants = [
    { id: ADMIN, admin: 'admin' },
    { id: OWNER, admin: 'superadmin' },
    { id: NORMAL, admin: null },
];
async function send(env, sock, m) { await env.sm.handleMessages(sock, h.BOT, { type: 'notify', messages: [m] }); await h.wait(40); }
const replies = (sock) => sock.sent.filter(x => x.content || x.presence || x.read);

test('mode: `.mode` never crashes on empty data and defaults to PUBLIC', async () => {
    h.resetData();
    const env = load();
    assert.equal(env.access.getMode(), 'public');
    const sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: OWNER, sender: OWNER, text: '.mode', fromMe: true }));
    assert.ok(replies(sock).some(x => /Current: \*PUBLIC\*/.test(x.content?.text || '')), 'shows real mode');
});

test('owner-only mode controls: mod, sudo, group admin, normal user cannot change mode', async () => {
    h.resetData();
    const env = load();
    env.db.addModUser(h.BOT, MOD);
    env.db.addSudoUser(h.BOT, SUDO);
    for (const who of [MOD, SUDO, ADMIN, NORMAL]) {
        for (const cmd of ['.mode private', '.private', '.mode public', '.public']) {
            const sock = h.makeSock(participants);
            await send(env, sock, h.textMsg({ from: GROUP, sender: who, text: cmd }));
            assert.equal(env.access.getMode(), 'public', `${who} must not change mode via ${cmd}`);
        }
    }
});

test('owner enables private mode; persists across restart; owner can switch back', async () => {
    h.resetData();
    let env = load();
    const sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: OWNER, text: '.mode private', fromMe: true }));
    assert.equal(env.access.getMode(), 'private');
    assert.ok(replies(sock).some(x => /PRIVATE MODE ON/.test(x.content?.text || '')));
    env = load();                                    // ← restart
    assert.equal(env.access.getMode(), 'private', 'mode survives restart');
    const sock2 = h.makeSock(participants);
    await send(env, sock2, h.textMsg({ from: GROUP, sender: OWNER, text: '.public', fromMe: true }));
    assert.equal(env.access.getMode(), 'public');
    env = load();
    assert.equal(env.access.getMode(), 'public');
});

test('private mode: normal member, DM user, mod, group admin get ABSOLUTELY nothing (commands, AI, chatbot, auto-features)', async () => {
    h.resetData();
    const env = load();
    env.db.addModUser(h.BOT, MOD);
    env.db.setBotMode('private');
    // turn every automatic responder on
    env.db.setGroup(GROUP, 'chatbot', true);
    env.db.setGroup(GROUP, 'nextyai', true);
    env.db.setGroup(GROUP, 'autoreact', true);
    env.db.setChatbotDM(h.BOT, true);
    env.db.setNeuro(h.BOT, true);
    env.db.setAutoTyping(h.BOT, true);
    env.db.setAutoRead(h.BOT, true);
    env.db.setGroup(NORMAL, 'nextyai', true);

    const cases = [
        [GROUP, NORMAL, '.ping'], [GROUP, NORMAL, '.menu'], [GROUP, NORMAL, 'hello bot'],
        [GROUP, NORMAL, 'neuro status'], [GROUP, MOD, '.ping'], [GROUP, ADMIN, '.ping'], [GROUP, ADMIN, '.antilink on'],
        [NORMAL, NORMAL, '.ping'], [NORMAL, NORMAL, 'hi there'], [MOD, MOD, '.menu'],
    ];
    for (const [from, sender, text] of cases) {
        const sock = h.makeSock(participants);
        await send(env, sock, h.textMsg({ from, sender, text }));
        assert.deepEqual(sock.sent, [], `no response at all for ${sender} in ${from}: "${text}" (got ${JSON.stringify(sock.sent).slice(0, 200)})`);
    }
    assert.equal(env.db.getGroup(GROUP).antilink, false, 'unauthorized admin could not change settings');
});

test('private mode: buttons / interactive replies from unauthorized users are ignored', async () => {
    h.resetData();
    const env = load();
    env.db.setBotMode('private');
    const sock = h.makeSock(participants);
    const btn = h.textMsg({ from: GROUP, sender: NORMAL, text: '' });
    btn.message = { buttonsResponseMessage: { selectedButtonId: 'ping_btn' } };
    await send(env, sock, btn);
    await env.sm.handleButtonResponse(sock, h.BOT, btn, 'ping_btn');
    const chroma = h.textMsg({ from: GROUP, sender: NORMAL, text: '' });
    await env.sm.handleButtonResponse(sock, h.BOT, chroma, 'chroma:.menu');
    assert.deepEqual(sock.sent, []);
});

test('private mode: owner and configured sudo DO get replies; mods do not; public mode reopens for everyone', async () => {
    h.resetData();
    const env = load();
    env.db.addSudoUser(h.BOT, SUDO);
    env.db.addModUser(h.BOT, MOD);
    env.db.setBotMode('private');

    let sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: SUDO, text: '.ping' }));
    assert.ok(replies(sock).length > 0, 'sudo receives replies');

    sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: OWNER, text: '.ping', fromMe: true }));
    assert.ok(replies(sock).length > 0, 'owner receives replies');

    sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: MOD, text: '.ping' }));
    assert.deepEqual(sock.sent, [], 'mod without sudo is blocked');

    env.access.setMode('public');
    sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: NORMAL, text: '.ping' }));
    assert.ok(replies(sock).length > 0, 'public mode allows normal users again');
});

test('public mode never bypasses owner/sudo/admin/group permissions', async () => {
    h.resetData();
    const env = load();
    const A = env.access.authorizeCommand;
    const base = { isGroup: true, isOwner: false, isSudo: false, isMod: false, isAdmin: false };
    assert.equal(A({ ownerOnly: true }, base).allowed, false);
    assert.equal(A({ ownerOnly: true }, { ...base, isMod: true, isSudo: true, isAdmin: true }).allowed, false, 'mod/sudo/admin are not owner');
    assert.equal(A({ ownerOnly: true }, { ...base, isOwner: true }).allowed, true);
    assert.equal(A({ sudoOnly: true }, base).allowed, false);
    assert.equal(A({ sudoOnly: true }, { ...base, isSudo: true }).allowed, true);
    assert.equal(A({ adminOnly: true }, base).allowed, false);
    assert.equal(A({ adminOnly: true }, { ...base, isAdmin: true }).allowed, true);
    assert.equal(A({ groupOnly: true }, { ...base, isGroup: false }).allowed, false);
    assert.equal(A({ category: 'owner' }, { ...base, isMod: true }).allowed, true, 'mods keep non-ownerOnly owner commands');
    assert.equal(A({ category: 'owner' }, base).allowed, false);
    env.db.setBotMode('private');
    assert.equal(A({}, base).allowed, false);
    assert.equal(A({}, { ...base, isAdmin: true, isMod: true }).allowed, false, 'private blocks admins & mods');
    assert.equal(A({ adminOnly: true }, { ...base, isSudo: true }).allowed, true);
    assert.equal(A({}, base).reply, null, 'private refusal is silent');
});

test('dispatcher: real commands are enforced end-to-end in public mode', async () => {
    h.resetData();
    const env = load();
    env.db.addModUser(h.BOT, MOD);
    // mod / normal cannot grant sudo (ownerOnly) — and no sudo is created
    for (const who of [MOD, NORMAL, ADMIN]) {
        const sock = h.makeSock(participants);
        await send(env, sock, h.textMsg({ from: GROUP, sender: who, text: '.setsudo 15550000077' }));
        assert.equal(env.db.getSudoUsers(h.BOT).length, 0, `${who} must not create sudo`);
    }
    // normal member cannot unban; unban is owner only
    env.db.setBanned('15550000055', true);
    let sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: NORMAL, text: '.unban 15550000055' }));
    assert.equal(env.db.isBanned('15550000055'), true);
    sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: OWNER, sender: OWNER, text: '.unban 15550000055', fromMe: true }));
    assert.equal(env.db.isBanned('15550000055'), false);
    // non-admin cannot broadcast/tagall
    sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: NORMAL, text: '.broadcast hi' }));
    assert.ok(!sock.sent.some(x => /BROADCAST/.test(x.content?.text || '')));
    // admin can
    sock = h.makeSock(participants);
    await send(env, sock, h.textMsg({ from: GROUP, sender: ADMIN, text: '.broadcast hi' }));
    assert.ok(sock.sent.some(x => /BROADCAST/.test(x.content?.text || '')));
});

test('neuro: tagging/replying to the bot never grants owner powers to a normal user', async () => {
    h.resetData();
    const env = load();
    env.db.setNeuro(h.BOT, true);
    const sock = h.makeSock(participants);
    const m = h.textMsg({ from: GROUP, sender: NORMAL, text: `@${h.BOT} go private` , extra: {} });
    m.message = { extendedTextMessage: { text: `@${h.BOT} go private`, contextInfo: { mentionedJid: [`${h.BOT}@s.whatsapp.net`] } } };
    await send(env, sock, m);
    assert.equal(env.access.getMode(), 'public');
});

test('legacy migration: old per-session selfMode / index.js isPublic:false become the single bot-wide mode', async () => {
    // A) users.selfMode
    h.resetData();
    fs.mkdirSync(process.env.NEXTY_DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.NEXTY_DATA_DIR, 'users.json'), JSON.stringify({ '999888@lid': { selfMode: true }, [h.BOT]: {} }));
    let env = load();
    assert.equal(env.access.getMode(), 'private', 'users.selfMode migrated');
    env = load();
    assert.equal(env.access.getMode(), 'private', 'and stays after restart');
    assert.equal(JSON.parse(fs.readFileSync(path.join(process.env.NEXTY_DATA_DIR, 'settings.json'), 'utf8')).privateMode, true);
    env.access.setMode('public');
    env = load();
    assert.equal(env.access.getMode(), 'public', 'explicit public is not re-locked by stale legacy data');
    assert.ok(!Object.values(env.db.data.users).some(u => u && u.selfMode), 'legacy flags cleared');
    // B) bot_data.json isPublic:false
    h.resetData();
    fs.mkdirSync(process.env.NEXTY_DATA_DIR, { recursive: true });
    fs.writeFileSync(path.join(process.env.NEXTY_DATA_DIR, 'bot_data.json'), JSON.stringify({ statusSettings: { u1: { isPublic: false } } }));
    env = load();
    assert.equal(env.access.getMode(), 'private');
    // C) nothing configured anywhere => public
    h.resetData();
    env = load();
    assert.equal(env.access.getMode(), 'public');
});

test('group admin detection: phone JIDs, device JIDs and @lid JIDs', async () => {
    h.resetData();
    const env = load();
    const lidParts = [
        { id: '4444@lid', lid: '4444@lid', phoneNumber: ADMIN, admin: 'admin' },
        { id: '5555@lid', lid: '5555@lid', phoneNumber: NORMAL, admin: null },
    ];
    const sock = h.makeSock(lidParts);
    assert.equal(await env.sm._isGroupAdmin(sock, GROUP, '4444@lid'), true, 'lid sender, lid participant');
    assert.equal(await env.sm._isGroupAdmin(sock, GROUP, ADMIN), true, 'phone sender, lid participant w/ phoneNumber');
    assert.equal(await env.sm._isGroupAdmin(sock, GROUP, '15550000004:7@s.whatsapp.net'), true, 'device jid');
    assert.equal(await env.sm._isGroupAdmin(sock, GROUP, '5555@lid'), false);
    assert.equal(await env.sm._isGroupAdmin(sock, GROUP, NORMAL), false);
    const sock2 = h.makeSock(participants);
    assert.equal(await env.sm._isGroupAdmin(sock2, GROUP, ADMIN), true);
    assert.equal(await env.sm._isGroupAdmin(sock2, GROUP, NORMAL), false);
    assert.equal(env.access.isAdminInParticipants(lidParts, ['4444@lid']), true);
    assert.equal(env.access.isAdminInParticipants(lidParts, [ADMIN]), true);
    assert.equal(env.access.isAdminInParticipants(lidParts, ['5555@lid']), false);
    // end-to-end: admin whose message arrives as @lid can run an admin command
    const sock3 = h.makeSock(lidParts);
    await send(env, sock3, h.textMsg({ from: GROUP, sender: '4444@lid', text: '.antilink on' }));
    assert.equal(env.db.getGroup(GROUP).antilink, true);
    const sock4 = h.makeSock(lidParts);
    await send(env, sock4, h.textMsg({ from: GROUP, sender: '5555@lid', text: '.antilink off' }));
    assert.equal(env.db.getGroup(GROUP).antilink, true, 'non-admin lid cannot turn it off');
});

test('admin commands: ON/OFF is saved, survives restart, and non-admins cannot change it', async () => {
    h.resetData();
    let env = load();
    const toggles = [
        ['antilink', 'on', 'off', 'antilink'], ['antichannel', 'on', 'off', 'antichannel'],
        ['antimention', 'on', 'off', 'antimention'], ['antibug', 'off', 'on', 'antibug'],
        ['antibot', 'on', 'off', 'antibot'], ['antisticker', 'on', 'off', 'antisticker'],
        ['antivideo', 'on', 'off', 'antivideo'], ['antipicture', 'on', 'off', 'antipicture'],
        ['welcome', 'on', 'off', 'welcome'], ['goodbye', 'on', 'off', 'goodbye'],
        ['antispam', 'on', 'off', 'antispam'],
    ];
    const truthy = v => (v && typeof v === 'object') ? !!v.enabled : !!v;
    for (const [cmd, first, second, key] of toggles) {
        // normal member: no change
        const before = truthy(env.db.getGroup(GROUP)[key]);
        let sock = h.makeSock(participants);
        await send(env, sock, h.textMsg({ from: GROUP, sender: NORMAL, text: `.${cmd} ${first}` }));
        assert.equal(truthy(env.db.getGroup(GROUP)[key]), before, `${cmd}: normal member must not change it`);
        // admin: change and confirm with a message
        sock = h.makeSock(participants);
        await send(env, sock, h.textMsg({ from: GROUP, sender: ADMIN, text: `.${cmd} ${first}` }));
        const afterFirst = truthy(env.db.getGroup(GROUP)[key]);
        assert.equal(afterFirst, first === 'on', `${cmd} ${first} persisted (in memory)`);
        assert.ok(sock.sent.some(x => x.content?.text), `${cmd}: clear success/failure message sent`);
        env = load();                                          // restart
        assert.equal(truthy(env.db.getGroup(GROUP)[key]), first === 'on', `${cmd} ${first} survives restart`);
        sock = h.makeSock(participants);
        await send(env, sock, h.textMsg({ from: GROUP, sender: ADMIN, text: `.${cmd} ${second}` }));
        assert.equal(truthy(env.db.getGroup(GROUP)[key]), second === 'on', `${cmd} ${second} persisted`);
    }
    // antidelete / antiedit toggle commands
    for (const cmd of ['antidelete', 'antiedit']) {
        const sock = h.makeSock(participants);
        await send(env, sock, h.textMsg({ from: GROUP, sender: ADMIN, text: `.${cmd}` }));
        env = load();
        assert.equal(!!env.db.getGroup(GROUP)[cmd], true, `${cmd} persisted across restart`);
    }
});

test('group-only admin commands say so in DMs', async () => {
    h.resetData();
    const env = load();
    const sock = h.makeSock([]);
    await send(env, sock, h.textMsg({ from: NORMAL, sender: NORMAL, text: '.antilink on' }));
    assert.ok(sock.sent.some(x => /group/i.test(x.content?.text || '')));
});

test('antidelete / antiedit: listeners registered once; alerts go to the group (public) or owner DM only (private)', async () => {
    h.resetData();
    const env = load();
    const sock = h.makeSock(participants);
    assert.equal(env.sm.attachRuntimeListeners(sock, h.BOT, { dispatch: false }), true);
    const count = Object.values(sock.handlers).reduce((a, l) => a + l.length, 0);
    assert.equal(env.sm.attachRuntimeListeners(sock, h.BOT, { dispatch: false }), false, 'second attach is a no-op');
    assert.equal(Object.values(sock.handlers).reduce((a, l) => a + l.length, 0), count);

    env.db.setGroup(GROUP, 'antidelete', true);
    env.db.setGroup(GROUP, 'antiedit', true);
    const fire = async (evt, payload) => { for (const fn of sock.handlers[evt] || []) await fn(payload); await h.wait(60); };

    // cache original then delete it
    const original = h.textMsg({ from: GROUP, sender: NORMAL, text: 'secret original text' });
    await fire('messages.upsert', { type: 'notify', messages: [original] });
    const del = { key: { remoteJid: GROUP, fromMe: false, id: 'DEL1', participant: NORMAL }, message: { protocolMessage: { type: 0, key: { id: original.key.id, remoteJid: GROUP } } } };
    sock.sent.length = 0;
    await fire('messages.upsert', { type: 'notify', messages: [del] });
    assert.ok(sock.sent.some(x => x.jid === GROUP && /secret original text/.test(x.content?.text || '')), 'public: deleted text re-posted in group');

    // edit
    const original2 = h.textMsg({ from: GROUP, sender: NORMAL, text: 'first version' });
    await fire('messages.upsert', { type: 'notify', messages: [original2] });
    const edit = { key: { remoteJid: GROUP, fromMe: false, id: 'ED1', participant: NORMAL }, message: { protocolMessage: { type: 14, key: { id: original2.key.id }, editedMessage: { conversation: 'second version' } } } };
    sock.sent.length = 0;
    await fire('messages.upsert', { type: 'notify', messages: [edit] });
    const editAlert = sock.sent.find(x => /ANTI|𝗔𝗡𝗧𝗜/.test(x.content?.text || '') && /first version/.test(x.content?.text || ''));
    assert.ok(editAlert && /second version/.test(editAlert.content.text), 'antiedit shows original and edited text');
    assert.equal(editAlert.jid, GROUP);

    // private mode: never in the group
    env.access.setMode('private');
    const original3 = h.textMsg({ from: GROUP, sender: NORMAL, text: 'private-mode secret' });
    await fire('messages.upsert', { type: 'notify', messages: [original3] });
    const del3 = { key: { remoteJid: GROUP, fromMe: false, id: 'DEL3', participant: NORMAL }, message: { protocolMessage: { type: 0, key: { id: original3.key.id, remoteJid: GROUP } } } };
    sock.sent.length = 0;
    await fire('messages.upsert', { type: 'notify', messages: [del3] });
    assert.ok(!sock.sent.some(x => x.jid === GROUP && x.content), 'private: nothing posted to the group');
    assert.ok(sock.sent.some(x => x.jid === `${h.BOT}@s.whatsapp.net` && /private-mode secret/.test(x.content?.text || '')), 'private: alert delivered to owner DM');
});

test('welcome/goodbye and other automatic group responses are silent in private mode', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(GROUP, 'welcome', true);
    env.db.setGroup(GROUP, 'goodbye', true);
    const em = require('../lib/eventManager');
    env.access.setMode('private');
    const sock = h.makeSock(participants);
    await em.handleGroupParticipantsEvent(sock, h.BOT, { id: GROUP, participants: [NORMAL], action: 'add', author: ADMIN });
    await em.handleGroupParticipantsEvent(sock, h.BOT, { id: GROUP, participants: [NORMAL], action: 'remove', author: ADMIN });
    assert.deepEqual(sock.sent, []);
});

test('sticker-bound commands and natural-language routing cannot bypass permissions', async () => {
    h.resetData();
    const env = load();
    env.db.setStickerCmd(GROUP, Buffer.from('abc').toString('base64'), 'setsudo');
    const sock = h.makeSock(participants);
    const m = h.textMsg({ from: GROUP, sender: NORMAL, text: '' });
    m.message = { stickerMessage: { fileSha256: Buffer.from('abc') } };
    await send(env, sock, m);
    assert.equal(env.db.getSudoUsers(h.BOT).length, 0);
    assert.ok(!sock.sent.some(x => /Sudo granted/.test(x.content?.text || '')));
});

test('anti-call notice is not sent to unauthorized callers in private mode', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(h.BOT, 'nocall', true);
    env.access.setMode('private');
    const sock = h.makeSock(participants);
    sock.rejectCall = async () => {};
    env.sm.attachRuntimeListeners(sock, h.BOT, { dispatch: false });
    for (const fn of sock.handlers.call) await fn([{ id: 'c1', from: NORMAL, status: 'offer' }]);
    await h.wait(40);
    assert.ok(!sock.sent.some(x => x.content), 'no text sent');
});
