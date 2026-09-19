/**
 * Luxury Edition Theme Helper
 * - Fancy unicode font converter
 * - Decorative banner/box builder
 * - Typing/composing animation helper
 */

const boldMap = {
    a: '𝗮', b: '𝗯', c: '𝗰', d: '𝗱', e: '𝗲', f: '𝗳', g: '𝗴', h: '𝗵', i: '𝗶', j: '𝗷',
    k: '𝗸', l: '𝗹', m: '𝗺', n: '𝗻', o: '𝗼', p: '𝗽', q: '𝗾', r: '𝗿', s: '𝘀', t: '𝘁',
    u: '𝘂', v: '𝘃', w: '𝘄', x: '𝘅', y: '𝘆', z: '𝘇',
    A: '𝗔', B: '𝗕', C: '𝗖', D: '𝗗', E: '𝗘', F: '𝗙', G: '𝗚', H: '𝗛', I: '𝗜', J: '𝗝',
    K: '𝗞', L: '𝗟', M: '𝗠', N: '𝗡', O: '𝗢', P: '𝗣', Q: '𝗤', R: '𝗥', S: '𝗦', T: '𝗧',
    U: '𝗨', V: '𝗩', W: '𝗪', X: '𝗫', Y: '𝗬', Z: '𝗭',
    '0': '𝟬', '1': '𝟭', '2': '𝟮', '3': '𝟯', '4': '𝟰', '5': '𝟱', '6': '𝟲', '7': '𝟳', '8': '𝟴', '9': '𝟵'
};

// Bold serif style, used for headings inside the luxury banner
function fancyBold(text = '') {
    return String(text).split('').map(c => boldMap[c] || c).join('');
}

const smallCapsMap = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ', j: 'ᴊ',
    k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ', s: 'ꜱ', t: 'ᴛ',
    u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ'
};

function smallCaps(text = '') {
    return String(text).toLowerCase().split('').map(c => smallCapsMap[c] || c).join('');
}

/**
 * Builds a decorative luxury box.
 * @param {string} title - heading shown at the top of the box
 * @param {string[]} lines - body lines
 * @param {string} footer - optional footer line
 */
function banner(title, lines = [], footer = '') {
    const top = '╭─❖「 ' + fancyBold(title) + ' 」❖─╮';
    const body = lines.map(l => '│ ' + l).join('\n');
    const bottom = '╰' + '─'.repeat(Math.max(10, Math.min(28, title.length + 8))) + '─╯';
    const footerLine = footer ? `\n✦ ${footer}` : '';
    return `${top}\n${body}\n${bottom}${footerLine}`;
}

/**
 * A simple ON/OFF pill used inside settings menus.
 */
function toggle(state) {
    return state ? '🟢 ON' : '🔴 OFF';
}

/**
 * Plays a short "typing" animation by editing one message a few times,
 * then optionally leaves a final label on it. Falls back silently if
 * message editing isn't supported by the connection.
 *
 * @param {object} sock - baileys socket
 * @param {string} chatId
 * @param {object} quotedMsg - message to quote
 * @param {string} label - base label, e.g. "Processing"
 * @param {number} steps - how many animation frames to play
 */
async function animate(sock, chatId, quotedMsg, label = 'Processing', steps = 3) {
    let sent;
    try {
        sent = await sock.sendMessage(chatId, { text: `✨ ${label}.` }, { quoted: quotedMsg });
    } catch (e) {
        return null;
    }
    const dots = ['.', '..', '...'];
    for (let i = 0; i < steps; i++) {
        await new Promise(r => setTimeout(r, 350));
        try {
            await sock.sendMessage(chatId, {
                text: `✨ ${label}${dots[i % dots.length]}`,
                edit: sent.key
            });
        } catch (e) {
            break; // editing not supported on this connection/version, ignore
        }
    }
    return sent;
}

/**
 * Toggles WhatsApp's native "typing…" presence indicator around a task.
 * This is the safest cross-version "animation" since it's a built-in
 * WhatsApp UI element rather than a manually edited message.
 */
async function withTypingPresence(sock, chatId, task) {
    try { await sock.sendPresenceUpdate('composing', chatId); } catch (e) {}
    try {
        return await task();
    } finally {
        try { await sock.sendPresenceUpdate('paused', chatId); } catch (e) {}
    }
}

module.exports = { fancyBold, smallCaps, banner, toggle, animate, withTypingPresence };
