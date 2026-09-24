'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const h = require('./helpers');
test.after(() => { setTimeout(() => process.exit(process.exitCode || 0), 50).unref(); });

const GROUP = '120363000000000002@g.us';
const OWNER = `${h.BOT}@s.whatsapp.net`;
const ADMIN = '15550000004@s.whatsapp.net';
const NORMAL = '15550000009@s.whatsapp.net';
const FRIEND = '15550000012@s.whatsapp.net';
const parts = [{ id: ADMIN, admin: 'admin' }, { id: OWNER, admin: 'superadmin' }, { id: NORMAL, admin: null }];

function load() {
    h.restart();
    const sm = require('../lib/sessionManager');
    const db = require('../utils/database');
    const access = require('../lib/access');
    const loader = require('../utils/commandLoader');
    if (!loader.getAll().length) loader.loadCommands();
    return { sm, db, access };
}
async function cmd(env, sock, m) { await env.sm.handleMessages(sock, h.BOT, { type: 'notify', messages: [m] }); await h.wait(40); }
function boot(env, sock) {
    env.sm.attachRuntimeListeners(sock, h.BOT, { dispatch: false });
    env.sm.recover.downloader = async (media) => Buffer.from(media.__bytes || 'BYTES');
    const fire = async (evt, payload) => { for (const fn of sock.handlers[evt] || []) await fn(payload); await h.wait(60); };
    return fire;
}
const inboxTexts = (sock) => sock.sent.filter(x => x.jid === OWNER && x.content?.text).map(x => x.content.text);
const revoke = (jid, id, participant, fromMe = false) => ({ key: { remoteJid: jid, fromMe, id: 'R' + id, ...(participant ? { participant } : {}) }, message: { protocolMessage: { type: 0, key: { id, remoteJid: jid } } } });

test('owner switches: `.antidelete on` in personal chat is bot-wide; non-owner cannot; admin can do group-only', async () => {
    h.resetData();
    const env = load();
    let sock = h.makeSock(parts);
    await cmd(env, sock, h.textMsg({ from: NORMAL, sender: NORMAL, text: '.antidelete on' }));
    assert.equal(!!env.db.getGroup(h.BOT).antidelete, false, 'normal DM user cannot switch on bot-wide');
    sock = h.makeSock(parts);
    await cmd(env, sock, h.textMsg({ from: GROUP, sender: NORMAL, text: '.antidelete group on' }));
    assert.equal(!!env.db.getGroup(GROUP).antidelete, false, 'normal member cannot');
    sock = h.makeSock(parts);
    await cmd(env, sock, h.textMsg({ from: GROUP, sender: ADMIN, text: '.antidelete group on' }));
    assert.equal(!!env.db.getGroup(GROUP).antidelete, true, 'group admin: group only');
    assert.equal(!!env.db.getGroup(h.BOT).antidelete, false);
    for (const c of ['antidelete', 'antiedit', 'antistatus']) {
        sock = h.makeSock(parts);
        await cmd(env, sock, h.textMsg({ from: OWNER, sender: OWNER, text: `. ${c} on`, fromMe: true }));
    }
    const rec = env.db.getGroup(h.BOT);
    assert.deepEqual([!!rec.antidelete, !!rec.antiedit, !!rec.antistatusdelete], [true, true, true]);
    const env2 = load();                                              // restart
    const rec2 = env2.db.getGroup(h.BOT);
    assert.deepEqual([!!rec2.antidelete, !!rec2.antiedit, !!rec2.antistatusdelete], [true, true, true], 'persist across restart');
    sock = h.makeSock(parts);
    await cmd(env2, sock, h.textMsg({ from: OWNER, sender: OWNER, text: '.antidelete off', fromMe: true }));
    assert.equal(!!env2.db.getGroup(h.BOT).antidelete, false, 'explicit off works (no accidental toggle)');
    await cmd(env2, sock, h.textMsg({ from: OWNER, sender: OWNER, text: '.antidelete off', fromMe: true }));
    assert.equal(!!env2.db.getGroup(h.BOT).antidelete, false, 'off stays off');
});

test('personal chat: deleted + edited messages are shown in the owner inbox', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(h.BOT, 'antidelete', true);
    env.db.setGroup(h.BOT, 'antiedit', true);
    const sock = h.makeSock(parts);
    const fire = await boot(env, sock);

    const m1 = h.textMsg({ from: FRIEND, sender: FRIEND, text: 'secret dm' });
    await fire('messages.upsert', { type: 'notify', messages: [m1] });
    await fire('messages.upsert', { type: 'notify', messages: [revoke(FRIEND, m1.key.id)] });
    let texts = inboxTexts(sock);
    assert.ok(texts.some(t => /ANTI-DELETE/.test(t) && /secret dm/.test(t) && /Personal chat/.test(t)), 'DM delete shown in inbox');
    assert.ok(!sock.sent.some(x => x.jid === FRIEND), 'nothing sent to the friend');

    const m2 = h.textMsg({ from: FRIEND, sender: FRIEND, text: 'first' });
    await fire('messages.upsert', { type: 'notify', messages: [m2] });
    const edit = { key: { remoteJid: FRIEND, fromMe: false, id: 'E1' }, message: { protocolMessage: { type: 14, key: { id: m2.key.id }, editedMessage: { conversation: 'second' } } } };
    await fire('messages.upsert', { type: 'notify', messages: [edit] });
    texts = inboxTexts(sock);
    assert.ok(texts.some(t => /ANTI-EDIT/.test(t) && /first/.test(t) && /second/.test(t)), 'DM edit shown in inbox');
});

test('edits arriving as editedMessage wrapper or via messages.update are detected once (deduped)', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(h.BOT, 'antiedit', true);
    const sock = h.makeSock(parts);
    const fire = await boot(env, sock);
    const m = h.textMsg({ from: GROUP, sender: NORMAL, text: 'Hi' });
    await fire('messages.upsert', { type: 'notify', messages: [m] });
    const wrapper = { key: { remoteJid: GROUP, fromMe: false, id: 'W1', participant: NORMAL }, message: { editedMessage: { message: { protocolMessage: { type: 14, key: { id: m.key.id, remoteJid: GROUP }, editedMessage: { conversation: 'Hiko' } } } } } };
    await fire('messages.upsert', { type: 'notify', messages: [wrapper] });
    await fire('messages.update', [{ key: { remoteJid: GROUP, id: m.key.id, participant: NORMAL, fromMe: false }, update: { message: { editedMessage: { message: { conversation: 'Hiko' } } } } }]);
    const alerts = inboxTexts(sock).filter(t => /ANTI-EDIT/.test(t));
    assert.equal(alerts.length, 1, 'reported once');
    assert.ok(/Hi/.test(alerts[0]) && /Hiko/.test(alerts[0]) && /Group/.test(alerts[0]));
    // update-only path (no upsert)
    const m2 = h.textMsg({ from: FRIEND, sender: FRIEND, text: 'aaa' });
    await fire('messages.upsert', { type: 'notify', messages: [m2] });
    await fire('messages.update', [{ key: { remoteJid: FRIEND, id: m2.key.id, fromMe: false }, update: { message: { editedMessage: { message: { conversation: 'bbb' } } } } }]);
    assert.ok(inboxTexts(sock).some(t => /aaa/.test(t) && /bbb/.test(t)), 'messages.update edit works');
    // delete through messages.update
    env.db.setGroup(h.BOT, 'antidelete', true);
    const m3 = h.textMsg({ from: FRIEND, sender: FRIEND, text: 'gone soon' });
    await fire('messages.upsert', { type: 'notify', messages: [m3] });
    await fire('messages.update', [{ key: { remoteJid: FRIEND, id: m3.key.id, fromMe: false }, update: { message: null, messageStubType: 1 } }]);
    assert.ok(inboxTexts(sock).some(t => /ANTI-DELETE/.test(t) && /gone soon/.test(t)), 'messages.update revoke works');
});

test('owner\'s own deletes/edits are ignored; media is recovered from bytes captured on arrival', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(h.BOT, 'antidelete', true);
    const sock = h.makeSock(parts);
    const fire = await boot(env, sock);
    const mine = h.textMsg({ from: FRIEND, sender: OWNER, text: 'my own', fromMe: true });
    await fire('messages.upsert', { type: 'notify', messages: [mine] });
    await fire('messages.upsert', { type: 'notify', messages: [revoke(FRIEND, mine.key.id, null, true)] });
    assert.equal(sock.sent.length, 0);

    const img = h.textMsg({ from: FRIEND, sender: FRIEND, text: '' });
    img.message = { imageMessage: { caption: 'my photo', mimetype: 'image/jpeg', __bytes: 'IMGBYTES' } };
    await fire('messages.upsert', { type: 'notify', messages: [img] });
    await h.wait(50);
    env.sm.recover.downloader = async () => { throw new Error('server copy gone'); };   // deleted media no longer downloadable
    await fire('messages.upsert', { type: 'notify', messages: [revoke(FRIEND, img.key.id)] });
    const out = sock.sent.find(x => x.jid === OWNER && x.content?.image);
    assert.ok(out, 'image resent to inbox');
    assert.equal(out.content.image.toString(), 'IMGBYTES');
    assert.ok(/my photo/.test(out.content.caption));
});

test('anti-status-delete: deleted status (text + media) is sent to the inbox', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(h.BOT, 'antistatusdelete', true);
    const sock = h.makeSock(parts);
    const fire = await boot(env, sock);
    const st = h.textMsg({ from: 'status@broadcast', sender: FRIEND, text: 'my status text' });
    st.key.participant = FRIEND;
    await fire('messages.upsert', { type: 'notify', messages: [st] });
    await fire('messages.upsert', { type: 'notify', messages: [revoke('status@broadcast', st.key.id, FRIEND)] });
    assert.ok(inboxTexts(sock).some(t => /ANTI-STATUS DELETE/.test(t) && /my status text/.test(t) && /Status of/.test(t)));

    const st2 = { key: { remoteJid: 'status@broadcast', fromMe: false, id: 'ST2', participant: FRIEND }, message: { videoMessage: { caption: 'clip', mimetype: 'video/mp4', __bytes: 'VID' } } };
    await fire('messages.upsert', { type: 'notify', messages: [st2] });
    await h.wait(50);
    await fire('messages.update', [{ key: { remoteJid: 'status@broadcast', id: 'ST2', participant: FRIEND, fromMe: false }, update: { message: null, messageStubType: 1 } }]);
    assert.ok(sock.sent.some(x => x.jid === OWNER && x.content?.video), 'status video recovered');
    // switched off → nothing
    env.db.setGroup(h.BOT, 'antistatusdelete', false);
    sock.sent.length = 0;
    await fire('messages.upsert', { type: 'notify', messages: [revoke('status@broadcast', st.key.id + 'x', FRIEND)] });
    assert.equal(sock.sent.length, 0);
});

test('private mode: group alerts go to the inbox only; bot-wide alerts still reach the owner', async () => {
    h.resetData();
    const env = load();
    env.db.setGroup(GROUP, 'antidelete', true);
    env.access.setMode('private');
    const sock = h.makeSock(parts);
    const fire = await boot(env, sock);
    const m = h.textMsg({ from: GROUP, sender: NORMAL, text: 'private secret' });
    await fire('messages.upsert', { type: 'notify', messages: [m] });
    await fire('messages.upsert', { type: 'notify', messages: [revoke(GROUP, m.key.id, NORMAL)] });
    assert.ok(!sock.sent.some(x => x.jid === GROUP));
    assert.ok(inboxTexts(sock).some(t => /private secret/.test(t)));
});

test('status automation: .statusview / .statusreact / .statusemoji persist and drive handleStatus', async () => {
    h.resetData();
    let env = load();
    const say = async (text, from = OWNER, sender = OWNER, fromMe = true) => { const s = h.makeSock(parts); await cmd(env, s, h.textMsg({ from, sender, text, fromMe })); return s; };

    // non-owner cannot
    await say('.statusview on', NORMAL, NORMAL, false);
    assert.equal(env.db.getAutoViewStatus(h.BOT), false);
    await say('.statusemoji 🍬', NORMAL, NORMAL, false);
    assert.deepEqual(env.db.getStatusEmojis(h.BOT), ['❤️']);

    await say('. statusview on');
    await say('.statusreact on');
    const s = await say('.statusemoji 🍬🎊💓💗💙');
    assert.ok(s.sent.some(x => /🍬 🎊 💓 💗 💙/.test(x.content?.text || '')));
    env = load();                                                       // restart
    assert.equal(env.db.getAutoViewStatus(h.BOT), true);
    assert.equal(env.db.getStatusReact(h.BOT), true);
    assert.deepEqual(env.db.getStatusEmojis(h.BOT), ['🍬', '🎊', '💓', '💗', '💙']);

    const st = { key: { remoteJid: 'status@broadcast', fromMe: false, id: 'S1', participant: FRIEND }, message: { conversation: 'hi' } };
    const sock = h.makeSock(parts);
    await env.sm.handleStatus(sock, h.BOT, st);
    assert.ok(sock.sent.some(x => x.read), 'status viewed');
    const react = sock.sent.find(x => x.content?.react);
    assert.ok(react && ['🍬', '🎊', '💓', '💗', '💙'].includes(react.content.react.text), 'custom emoji used');
    assert.deepEqual(react.opts, { statusJidList: [FRIEND] });

    // react off, view on → only view
    const s2 = await say('.statusreact off');
    const sock2 = h.makeSock(parts);
    await env.sm.handleStatus(sock2, h.BOT, { ...st, key: { ...st.key, id: 'S2' } });
    assert.ok(sock2.sent.some(x => x.read) && !sock2.sent.some(x => x.content?.react));
    // view off, react on → only react
    await say('.statusview off'); await say('.statusreact on');
    const sock3 = h.makeSock(parts);
    await env.sm.handleStatus(sock3, h.BOT, { ...st, key: { ...st.key, id: 'S3' } });
    assert.ok(!sock3.sent.some(x => x.read) && sock3.sent.some(x => x.content?.react));
    // works while private mode is on (owner automation)
    env.access.setMode('private');
    const sock4 = h.makeSock(parts);
    await env.sm.handleStatus(sock4, h.BOT, { ...st, key: { ...st.key, id: 'S4' } });
    assert.ok(sock4.sent.some(x => x.content?.react));
    // via full pipeline: status message reaches handler through handleMessages
    const sock5 = h.makeSock(parts);
    await env.sm.handleMessages(sock5, h.BOT, { type: 'notify', messages: [{ ...st, key: { ...st.key, id: 'S5' } }] });
    assert.ok(sock5.sent.some(x => x.content?.react));
});
