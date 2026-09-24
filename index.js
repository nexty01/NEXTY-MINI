require('dotenv').config();
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const fs = require('fs-extra');
const path = require('path');
const axios = require('axios');
const TelegramBot = require('node-telegram-bot-api');
const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion, makeCacheableSignalKeyStore, downloadContentFromMessage, jidNormalizedUser, Browsers, delay } = require('@whiskeysockets/baileys');
const P = require('pino');
const { OpenAI } = require('openai');
const os = require('os');
const { banner: luxuryBanner, fancyBold: luxBold } = require('./lib/luxury');
const sessionManager = require('./lib/sessionManager');   // shared identity + moderation engine + runtime listeners
const access = require('./lib/access');                   // ONE private/public mode + permission rules
const botDatabase = require('./utils/database');
const { applyPolicy } = require('./lib/commandPolicy');
try { require('./utils/commandLoader').loadCommands(); } catch (e) { console.error('[LOADER]', e.message); }

// Safety net: log unexpected errors instead of letting them kill the whole process/dyno
process.on('unhandledRejection', (reason) => {
    console.error('[UNHANDLED REJECTION]', reason && reason.message ? reason.message : reason);
});
process.on('uncaughtException', (err) => {
    console.error('[UNCAUGHT EXCEPTION]', err && err.message ? err.message : err);
});


// =================== NEXTY MINI 👀 — DYNAMIC COMMAND LOADER ===================
// Loads every command module from ./commands/<category>/*.js
// Each module exports: { name, aliases?, category?, execute(ctx) }
// (Old flat ./commands/xxx.js files no longer exist; everything routes here.)

const DANGEROUS_COMMANDS = new Set([
    'smsbomb', 'callbomb', 'crash', 'freeze', 'lag', 'bug', 'locspam', 'vcardspam',
    'buttonspam', 'pollspam', 'contactspam', 'nuke', 'spam', 'deleteall',
    'xrestart', 'xshutdown', 'hack', 'ghostmode2'
]);
const EXCLUDED_CATEGORIES = new Set(['18plus', 'anime-nsfw', 'expansion', 'economy']);
// Short aliases for the old-style (plain function) command files in commands/media
const OLD_STYLE_ALIASES = {
    insta:     ['ig', 'instagram', 'igdl'],
    tiktok:    ['tt', 'ttdl'],
    facebook:  ['fb', 'fbdl'],
    play:      ['song', 'ytmp3'],
    video:     ['ytv', 'ytvideo', 'ytmp4', 'yt'],
    apk:       ['apkdl']
};

const dynamicRegistry = {};

function loadDynamicCommands() {
    const commandsRoot = path.join(__dirname, 'commands');
    let categories = [];
    try { categories = fs.readdirSync(commandsRoot); } catch (e) { return; }

    for (const cat of categories) {
        if (EXCLUDED_CATEGORIES.has(cat)) continue;
        const catPath = path.join(commandsRoot, cat);
        let stat;
        try { stat = fs.statSync(catPath); } catch (e) { continue; }
        if (!stat.isDirectory()) continue;

        let files = [];
        try { files = fs.readdirSync(catPath); } catch (e) { continue; }

        for (const file of files) {
            if (!file.endsWith('.js')) continue;
            const filePath = path.join(catPath, file);
            let mod;
            try { mod = require(filePath); } catch (e) {
                console.log(`⚠️  Skipped command (load error): ${cat}/${file} — ${e.message}`);
                continue;
            }
            // Support two export styles:
            // 1) NEXTY style: { name, aliases?, category?, execute(ctx) }
            // 2) Old flat style: module.exports = function(sock, from, msg, q) {...}
            if (typeof mod === 'function') {
                const fnName = path.basename(file, '.js').toLowerCase();
                const rawFn = mod;
                mod = {
                    name: fnName,
                    aliases: OLD_STYLE_ALIASES[fnName] || [],
                    category: cat,
                    execute: (ctx) => rawFn(ctx.sock, ctx.from, ctx.msg, ctx.q)
                };
            }
            if (!mod || typeof mod.execute !== 'function' || !mod.name) continue;

            const name = String(mod.name).toLowerCase();
            if (DANGEROUS_COMMANDS.has(name)) continue;
            applyPolicy(mod);
            dynamicRegistry[name] = mod;

            if (Array.isArray(mod.aliases)) {
                for (const alias of mod.aliases) {
                    const a = String(alias).toLowerCase();
                    if (DANGEROUS_COMMANDS.has(a)) continue;
                    if (dynamicRegistry[a]) continue;
                    dynamicRegistry[a] = mod;
                }
            }
        }
    }

    console.log(`✅ NEXTY MINI 👀: loaded ${Object.keys(dynamicRegistry).length} command names/aliases`);
}
loadDynamicCommands();

function makeReply(sock, msg, from) {
    return async (content, opts = {}) => {
        try {
            if (typeof content === 'string') {
                return await sock.sendMessage(from, { text: content }, { quoted: msg, ...opts });
            }
            return await sock.sendMessage(from, content, { quoted: msg, ...opts });
        } catch (e) {
            console.log('reply() error:', e.message);
        }
    };
}

// Runs a command from the dynamic registry. Returns false if no such
// command exists (caller decides what "unknown command" message to show).
async function runDynamicCommand(commandName, sock, from, msg) {
    const name = String(commandName).toLowerCase();
    if (DANGEROUS_COMMANDS.has(name)) {
        await sock.sendMessage(from, { text: `❌ *.${commandName}* is disabled.` }, { quoted: msg });
        return true;
    }

    const mod = dynamicRegistry[name];
    if (!mod) return false;

    const isGroup = from.endsWith('@g.us');
    const sender = msg.key.participant || from;
    const isMe = !!msg.key.fromMe;

    const messageContent = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message || {};
    const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || '').trim();
    const tokens = text.replace(/^\.\s*/, '').trim().split(/\s+/);
    tokens.shift();
    const args = tokens;
    const q = args.join(' ');

    const settingsLocal = require('./settings');
    // Identity is resolved once per message by the session (LID-aware) and attached to msg.
    const acc = msg.__nextyAccess || null;
    const senderIsOwner = acc ? acc.senderIsOwner : isMe;      // never guess: no identity => only fromMe
    const senderIsSudo = acc ? acc.senderIsSudo : false;
    const senderIsMod = acc ? acc.senderIsMod : false;
    let senderIsAdmin = senderIsOwner;
    if (!senderIsAdmin && isGroup) {
        senderIsAdmin = acc && typeof acc.senderIsAdmin === 'boolean'
            ? acc.senderIsAdmin
            : await sessionManager._isGroupAdmin(sock, from, sender).catch(() => false);
    }
    const phoneKey = acc?.phoneKey || String(sock?.user?.id || '').split('@')[0].split(':')[0].replace(/\D/g, '');

    // Central mode + permission rules (ownerOnly/sudoOnly/adminOnly/groupOnly). Private mode => silent.
    const verdict = access.authorizeCommand(mod, {
        isGroup, isOwner: senderIsOwner, isSudo: senderIsSudo, isMod: senderIsMod, isAdmin: senderIsAdmin,
    });
    if (!verdict.allowed) {
        if (verdict.reply) { try { await sock.sendMessage(from, { text: verdict.reply }, { quoted: msg }); } catch (_) {} }
        return true;
    }

    const ctx = {
        sock, client: sock, msg, m: msg, from, sender, isGroup,
        isAdmin: senderIsAdmin,
        isOwner: senderIsOwner || (senderIsMod && mod.category === 'owner' && !mod.ownerOnly),
        isRealOwner: senderIsOwner, isSudo: senderIsSudo, isMod: senderIsMod, isMe,
        isBotAdmin: false, phoneNumber: phoneKey, database: botDatabase, key: msg.key.id,
        prefix: settingsLocal.prefix || '.',
        args, text, q,
        quoted: msg.message?.extendedTextMessage?.contextInfo?.quotedMessage || null,
        reply: makeReply(sock, msg, from),
        pushName: msg.pushName || 'User'
    };

    try {
        await mod.execute(ctx);
    } catch (e) {
        console.log(`Command "${name}" error:`, e.message);
        try {
            await sock.sendMessage(from, { text: `❌ Command *.${commandName}* failed: ${e.message}` }, { quoted: msg });
        } catch (e2) {}
    }
    return true;
}

// Legacy 'commands.xxx(sock, from, msg, ...)' call sites (used throughout the
// switch below) are preserved by routing every property access through the
// dynamic registry above.
const commands = new Proxy({}, {
    get(_target, prop) {
        return async (sock, from, msg) => {
            await runDynamicCommand(prop, sock, from, msg);
        };
    }
});

// autoread / autostatus / antidelete / antiedit are now regular toggle
// commands (.autoread, .antidelete, .antiedit) served by the dynamic
// loader above, not inline pipeline hooks — so these become safe no-ops.
const handleAutoread = async () => {};
const handleStatusUpdate = async () => {};
const storeMessage = async () => {};
const handleMessageRevocation = async () => {};
const handleSnipe = () => {};
const storeForEdit = async () => {};
const handleMessageEdit = async () => {};


const app = express();
const server = http.createServer(app);

// Telegram Bot Setup
const tgToken = process.env.TELEGRAM_BOT_TOKEN;
if (!tgToken) {
    console.error('TELEGRAM_BOT_TOKEN not set in environment variables!');
}

const tgBot = tgToken ? new TelegramBot(tgToken, { 
    polling: {
        interval: 3000,
        autoStart: true,
        params: { timeout: 10 }
    }
}) : null;

if (tgBot) {
    tgBot.on('polling_error', (error) => {
        console.log('Telegram polling error:', error.message);
        if (error.message && (error.message.includes('409') || error.message.includes('Conflict'))) {
            console.log('Another instance detected. Stopping this instance...');
            tgBot.stopPolling();
        }
        if (error.message && error.message.includes('401')) {
            console.log('Telegram Token is invalid (401 Unauthorized).');
            tgBot.stopPolling();
        }
    });
}

// Import settings
const settings = require('./settings');

// Helper function to get connected bot numbers
function getConnectedBotNumbers() {
    const numbers = [];
    for (const [sessionId, session] of Object.entries(sessions)) {
        if (session.sock && session.sock.user) {
            const num = jidNormalizedUser(session.sock.user.id).split('@')[0];
            numbers.push(num);
        }
    }
    return numbers;
}

// Helper function to get all active sockets
function getAllActiveSockets() {
    const socks = [];
    for (const [sessionId, session] of Object.entries(sessions)) {
        if (session.sock && session.isConnected) {
            socks.push({ sock: session.sock, sessionId, phoneNumber: session.phoneNumber });
        }
    }
    return socks;
}

// Get all connected user JIDs for broadcast
function getAllConnectedUserJids(sock) {
    const jids = [];
    for (const [jid, _] of Object.entries(sock.chats || {})) {
        if (jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us')) {
            jids.push(jid);
        }
    }
    return jids;
}

// Premium check function
function isPremiumUser(chatId) {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
    if (chatId.toString() === ownerChatId) return true;
    if (settings.premiumUsers && settings.premiumUsers.includes(chatId.toString())) return true;
    return false;
}

// Owner check for Telegram
function isTgOwner(chatId) {
    const ownerChatId = process.env.OWNER_TELEGRAM_ID || settings.tgOwnerId;
    return chatId.toString() === ownerChatId;
}

// =================== TELEGRAM BOT (ONLY PAIRING + PREMIUM + OWNER-ONLY STATUS) ===================
if (tgBot) {
    tgBot.onText(/\/start/, async (msg) => {
        const chatId = msg.chat.id;
        const isOwner = isTgOwner(chatId);
        
        const welcomeMessage = 
            `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *NEXTY MINI 👀* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
            `*👀 LUXURY WHATSAPP AUTOMATION* 👀\n\n` +
            `Welcome to the most premium WhatsApp bot experience.\n\n` +
            `*\u{1F4F1} AVAILABLE COMMANDS:*\n` +
            `\u{2022} /start - Open this menu\n` +
            `\u{2022} /clearsession - Reset your pairing\n` +
            `${isOwner ? `\u{2022} /status - Bot overall status\n` : ''}` +
            `${isOwner ? `\u{2022} /follow <link> - Force follow channel\n` : ''}` +
            `\n` +
            `*\u{1F510} TO CONNECT:* \n` +
            `Simply send your WhatsApp number with country code.\n` +
            `Example: \`923372588635\`\n\n` +
            `> 👀 POWERED BY NEXTY MINI 👀 v3.0`;

        try {
            await tgBot.sendPhoto(chatId, settings.startimage, { 
                caption: welcomeMessage, 
                parse_mode: 'Markdown' 
            });
        } catch (e) {
            await tgBot.sendMessage(chatId, welcomeMessage, { parse_mode: 'Markdown' });
        }
    });

    // Clear Session Command
    tgBot.onText(/\/clearsession/, async (msg) => {
        const chatId = msg.chat.id;
        const userId = `tg_${chatId}`;
        
        if (sessions[userId]) {
            if (sessions[userId].sock) {
                try { await sessions[userId].sock.logout(); } catch(e) {}
            }
            const authPath = sessions[userId].authPath;
            if (fs.existsSync(authPath)) {
                fs.removeSync(authPath);
            }
            delete sessions[userId];
            await tgBot.sendMessage(chatId, `\u{1F5D1}\u{FE0F} *Session cleared!* You can now pair a new number.`, { parse_mode: 'Markdown' });
        } else {
            await tgBot.sendMessage(chatId, `\u{26A0}\u{FE0F} No active session found to clear.`, { parse_mode: 'Markdown' });
        }
    });

    // Follow Command - OWNER ONLY
    tgBot.onText(/\/follow (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) return;
        
        const channelLink = match[1].trim();
        const activeSocks = getAllActiveSockets();
        
        await tgBot.sendMessage(chatId, `\u{1F504} *Initiating Mass Follow...*\nTarget: ${channelLink}\nBots: ${activeSocks.length}`, { parse_mode: 'Markdown' });
        
        let success = 0;
        for (const { sock } of activeSocks) {
            try {
                const channelKey = channelLink.split('/channel/')[1] || channelLink.split('/').pop();
                const metadata = await sock.newsletterMetadata('invite', channelKey, 'GUEST');
                if (metadata && metadata.id) {
                    await sock.newsletterFollow(metadata.id);
                    success++;
                }
            } catch (e) {}
        }
        
        await tgBot.sendMessage(chatId, `\u{2705} *Mass Follow Complete!*\nSuccessfully followed: ${success}/${activeSocks.length}`, { parse_mode: 'Markdown' });
    });

    // Status command - OWNER ONLY
    tgBot.onText(/\/status/, async (msg) => {
        const chatId = msg.chat.id;
        
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        
        const connectedCount = Object.values(sessions).filter(s => s.isConnected).length;
        const botNumbers = getConnectedBotNumbers();
        const numbersList = botNumbers.length > 0 ? botNumbers.join('\n') : 'None';

        const statusMsg = 
            `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *NEXTY MINI 👀 STATUS* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
            `\u{1F4F1} *Connected Bots:* ${connectedCount}\n` +
            `\u{26A1} *Total Sessions:* ${Object.keys(sessions).length}\n\n` +
            `\u{1F522} *Active Numbers:*\n\`${numbersList}\`\n\n` +
            `> 👀 POWERED BY NEXTY MINI 👀 v3.0`;

        await tgBot.sendMessage(chatId, statusMsg, { parse_mode: 'Markdown' });
    });

    tgBot.onText(/\/addpremium (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        const targetId = match[1].trim();
        if (!settings.premiumUsers.includes(targetId)) {
            settings.premiumUsers.push(targetId);
            await tgBot.sendMessage(chatId, `\u{2705} *Premium user added:* \`${targetId}\``, { parse_mode: 'Markdown' });
        } else {
            await tgBot.sendMessage(chatId, `\u{26A0}\u{FE0F} User already premium: \`${targetId}\``, { parse_mode: 'Markdown' });
        }
    });

    tgBot.onText(/\/removepremium (.+)/, async (msg, match) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        const targetId = match[1].trim();
        const idx = settings.premiumUsers.indexOf(targetId);
        if (idx > -1) {
            settings.premiumUsers.splice(idx, 1);
            await tgBot.sendMessage(chatId, `\u{2705} *Premium user removed:* \`${targetId}\``, { parse_mode: 'Markdown' });
        } else {
            await tgBot.sendMessage(chatId, `\u{26A0}\u{FE0F} User not found in premium list: \`${targetId}\``, { parse_mode: 'Markdown' });
        }
    });

    tgBot.onText(/\/listpremium/, async (msg) => {
        const chatId = msg.chat.id;
        if (!isTgOwner(chatId)) {
            return tgBot.sendMessage(chatId, "\u{274C} *Owner only command!*", { parse_mode: 'Markdown' });
        }
        const list = settings.premiumUsers.length > 0 ? settings.premiumUsers.join('\n') : 'None';
        await tgBot.sendMessage(chatId, `\u{1F451} *Premium Users:*\n\n${list}`, { parse_mode: 'Markdown' });
    });

    // Pairing handler - when user sends a number
    tgBot.on('message', async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        if (!text || text.startsWith('/')) return;

        if (/^\d+$/.test(text)) {
            const userId = chatId.toString();
            if (!sessions[userId]) {
                sessions[userId] = new BotSession(userId);
            }

            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false
                };
                saveBotData();
            }

            const initMsg = 
                `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *NEXTY MINI 👀 PAIRING* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                `*\u{1F504} REQUESTING CODE...*\n` +
                `Target Number: \`${text}\`\n\n` +
                `_Please wait a few seconds..._`;

            await tgBot.sendMessage(chatId, initMsg, { parse_mode: 'Markdown' });
            sessions[userId].tgChatId = chatId;
            await sessions[userId].initialize(text);
        }
    });
}


// =================== WEB DASHBOARD SOCKET.IO ===================
const io = socketIo(server, {
    cors: { origin: "*" },
    transports: ['websocket', 'polling']
});

let openai = null;
if (process.env.OPENAI_API_KEY) {
    try {
        openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
            baseURL: process.env.AI_BASE_URL || "https://api.openai.com/v1"
        });
    } catch (e) {}
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname)));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/health', (req, res) => {
    res.status(200).send('OK');
});

const AUTH_DIR = './auth_info';
const DATA_FILE = './data/bot_data.json';
fs.ensureDirSync(AUTH_DIR);
fs.ensureDirSync('./data');

let botData = { antilinkGroups: {}, totalBots: 0, registeredBots: [], statusSettings: {}, antiDelete: {}, userNames: {}, antiCall: {}, broadcastHistory: [] };
if (fs.existsSync(DATA_FILE)) {
    try { botData = fs.readJsonSync(DATA_FILE); } catch (e) {}
}

function saveBotData() {
    fs.writeJsonSync(DATA_FILE, botData);
}

const sessions = {}; 
const userSockets = {}; 
const messageLogs = {}; 

// Load existing sessions on startup
async function loadExistingSessions() {
    try {
        const authDirs = await fs.readdir(AUTH_DIR);
        for (const userId of authDirs) {
            const authPath = path.join(AUTH_DIR, userId);
            const stats = await fs.stat(authPath);
            if (stats.isDirectory()) {
                const credsFile = path.join(authPath, 'creds.json');
                if (fs.existsSync(credsFile)) {
                    console.log(`[System] Found existing session for: ${userId}. Initializing...`);
                    if (!sessions[userId]) {
                        sessions[userId] = new BotSession(userId);
                        sessions[userId].initialize().catch(err => {
                            console.error(`[System] Failed to auto-initialize session ${userId}:`, err.message);
                        });
                    }
                }
            }
        }
    } catch (err) {
        console.error('[System] Error loading existing sessions:', err.message);
    }
}

// Bold font converter
const toBold = (text) => {
    const boldChars = {
        'a': '\u{1D5EE}', 'b': '\u{1D5EF}', 'c': '\u{1D5F0}', 'd': '\u{1D5F1}', 'e': '\u{1D5F2}', 'f': '\u{1D5F3}', 'g': '\u{1D5F4}', 'h': '\u{1D5F5}', 'i': '\u{1D5F6}', 'j': '\u{1D5F7}', 'k': '\u{1D5F8}', 'l': '\u{1D5F9}', 'm': '\u{1D5FA}', 'n': '\u{1D5FB}', 'o': '\u{1D5FC}', 'p': '\u{1D5FD}', 'q': '\u{1D5FE}', 'r': '\u{1D5FF}', 's': '\u{1D600}', 't': '\u{1D601}', 'u': '\u{1D602}', 'v': '\u{1D603}', 'w': '\u{1D604}', 'x': '\u{1D605}', 'y': '\u{1D606}', 'z': '\u{1D607}',
        'A': '\u{1D5D4}', 'B': '\u{1D5D5}', 'C': '\u{1D5D6}', 'D': '\u{1D5D7}', 'E': '\u{1D5D8}', 'F': '\u{1D5D9}', 'G': '\u{1D5DA}', 'H': '\u{1D5DB}', 'I': '\u{1D5DC}', 'J': '\u{1D5DD}', 'K': '\u{1D5DE}', 'L': '\u{1D5DF}', 'M': '\u{1D5E0}', 'N': '\u{1D5E1}', 'O': '\u{1D5E2}', 'P': '\u{1D5E3}', 'Q': '\u{1D5E4}', 'R': '\u{1D5E5}', 'S': '\u{1D5E6}', 'T': '\u{1D5E7}', 'U': '\u{1D5E8}', 'V': '\u{1D5E9}', 'W': '\u{1D5EA}', 'X': '\u{1D5EB}', 'Y': '\u{1D5EC}', 'Z': '\u{1D5ED}',
        '0': '\u{1D7EC}', '1': '\u{1D7ED}', '2': '\u{1D7EE}', '3': '\u{1D7EF}', '4': '\u{1D7F0}', '5': '\u{1D7F1}', '6': '\u{1D7F2}', '7': '\u{1D7F3}', '8': '\u{1D7F4}', '9': '\u{1D7F5}'
    };
    return text.split('').map(c => boldChars[c] || c).join('');
};

// Italic font converter
const toItalic = (text) => {
    const italicChars = {
        'a': '\u{1D608}', 'b': '\u{1D609}', 'c': '\u{1D60A}', 'd': '\u{1D60B}', 'e': '\u{1D60C}', 'f': '\u{1D60D}', 'g': '\u{1D60E}', 'h': '\u{1D60F}', 'i': '\u{1D610}', 'j': '\u{1D611}', 'k': '\u{1D612}', 'l': '\u{1D613}', 'm': '\u{1D614}', 'n': '\u{1D615}', 'o': '\u{1D616}', 'p': '\u{1D617}', 'q': '\u{1D618}', 'r': '\u{1D619}', 's': '\u{1D61A}', 't': '\u{1D61B}', 'u': '\u{1D61C}', 'v': '\u{1D61D}', 'w': '\u{1D61E}', 'x': '\u{1D61F}', 'y': '\u{1D620}', 'z': '\u{1D621}',
        'A': '\u{1D5CE}', 'B': '\u{1D5CF}', 'C': '\u{1D5D0}', 'D': '\u{1D5D1}', 'E': '\u{1D5D2}', 'F': '\u{1D5D3}'
    };
    return text.split('').map(c => italicChars[c] || c).join('');
};

class BotSession {
    constructor(userId) {
        this.userId = userId;
        this.sock = null;
        this.isConnected = false;
        this.aiEnabled = botData.statusSettings[userId]?.aiEnabled || false;
        this.autoReact = botData.statusSettings[userId]?.autoReact || false;
        this.authPath = path.join(AUTH_DIR, userId);
        this.processedMessages = new Set();
        this.activeInterval = null;
        this.isInitializing = false;
        this.userChats = {}; 
        this.lastConnectMessageTime = null;
        this.phoneNumber = null;
        this.ghostMode = botData.statusSettings[userId]?.ghostMode || false;
    }

    // Private/public mode is bot-wide and lives in lib/access (settings.privateMode).
    // These accessors keep older code (menus, .settings) working without a second copy of the state.
    get isPublic() { return !access.isPrivate(); }
    set isPublic(value) { access.setMode(value ? 'public' : 'private'); }

    phoneKey() {
        return this.phoneNumber || String(this.sock?.user?.id || '').split('@')[0].split(':')[0].replace(/\D/g, '') || String(this.userId);
    }

    // Persist the live toggle states of this session into bot_data.json
    // so `.settings` values survive a restart.
    persistToggles() {
        if (!botData.statusSettings[this.userId]) botData.statusSettings[this.userId] = {};
        Object.assign(botData.statusSettings[this.userId], {
            aiEnabled: this.aiEnabled,
            autoReact: this.autoReact,
            ghostMode: this.ghostMode
        });
        saveBotData();
    }

    sendLog(message, type = 'info') {
        const logEntry = { timestamp: new Date().toLocaleTimeString(), message, type };
        const socketId = userSockets[this.userId];
        if (socketId) io.to(socketId).emit('console', logEntry);
        console.log(`[${this.userId}] ${message}`);
    }

    sendConnectionStatus() {
        const socketId = userSockets[this.userId];
        if (socketId) {
            io.to(socketId).emit('connection-status', {
                connected: this.isConnected,
                user: this.userId
            });
        }
        io.emit('total-active', Object.values(sessions).filter(s => s.isConnected).length);
    }

    async getAIResponse(userJid, userMessage, systemPrompt = "Helpful assistant.") {
        try {
            // Using a more reliable AI API endpoint
            const apiUrl = `https://api.siputzx.my.id/api/ai/chatgpt?prompt=${encodeURIComponent(systemPrompt)}&text=${encodeURIComponent(userMessage)}`;
            const response = await axios.get(apiUrl);
            
            if (response.data && response.data.status) {
                return response.data.data;
            } else {
                // Fallback to another API if the first one fails
                const fallbackUrl = `https://widipe.com/openai?text=${encodeURIComponent(userMessage)}`;
                const fallbackRes = await axios.get(fallbackUrl);
                if (fallbackRes.data && fallbackRes.data.result) {
                    return fallbackRes.data.result;
                }
                throw new Error("Invalid API response from all sources");
            }
        } catch (error) {
            return "\u{274C} AI Error: " + error.message;
        }
    }

    startActiveCheck() {
        if (this.activeInterval) clearInterval(this.activeInterval);
        this.activeInterval = setInterval(async () => {
            if (this.isConnected && this.sock?.user) {
                try {
                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    await this.sock.sendMessage(botNumber, { 
                        text: "NEXTY \u{1D5E1}\u{1D5D8}\u{1D5EB}\u{1D5E7}\u{1D5EC} \u{1D5F1}\u{1D600} \u{1D603}\u{1D608}\u{1D5F1}\u{1D5F1}\u{1D5F2}\u{1D5F7}\u{1D5F2} \u{1F680}\n\n_24/7 Active System Working..._" 
                    });
                    this.sendLog("24/7 Keep-alive message sent to own DM. \u{2705}", "success");
                } catch (e) {
                    this.sendLog("Keep-alive failed: " + e.message, "error");
                }
            }
        }, 60 * 60 * 1000);
    }

    async initialize(pairingNumber = null) {
        if (this.isInitializing) {
            this.sendLog("Initialization already in progress...", "info");
            return;
        }
        this.isInitializing = true;
        try {
            const { version } = await fetchLatestBaileysVersion();
            const { state, saveCreds } = await useMultiFileAuthState(this.authPath);

            this.sock = makeWASocket({
                version,
                auth: {
                    creds: state.creds,
                    keys: makeCacheableSignalKeyStore(state.keys, P({ level: 'fatal' })),
                },
                printQRInTerminal: false,
                logger: P({ level: 'fatal' }),
                browser: Browsers.ubuntu('Chrome'),
                syncFullHistory: false,
                shouldSyncHistoryMessage: () => false,
                markOnlineOnConnect: true,
                keepSyedveIntervalMs: 30000,
                connectTimeoutMs: 60000,
                defaultQueryTimeoutMs: 60000,
                emitOwnEvents: true,
                retryRequestDelayMs: 5000,
                maxMsgRetryCount: 5,
                linkPreviewImageThumbnailWidth: 192,
                transactionOpts: { maxCommitRetries: 10, delayBetweenTriesMs: 3000 },
                getMessage: async (key) => {
                    if (messageLogs[key.id]) {
                        return { conversation: messageLogs[key.id].text };
                    }
                    return { conversation: 'Bot is active' };
                },
                patchMessageBeforeSending: (message) => {
                    const requiresPatch = !!(message.buttonsMessage || message.templateMessage || message.listMessage);
                    if (requiresPatch) {
                        return {
                            viewOnceMessage: {
                                message: {
                                    messageContextInfo: { deviceListMetadata: {}, deviceListMetadataVersion: 2 },
                                    ...message
                                }
                            }
                        };
                    }
                    return message;
                },
                generateHighQualityLinkPreview: true,
            });

            if (pairingNumber && !state.creds.registered) {
                if (!this.sock.authState.creds.registered) {
                    await delay(3000);
                    try {
                        let code = await this.sock.requestPairingCode(pairingNumber);
                        code = code?.match(/.{1,4}/g)?.join("-") || code;
                        this.sendLog(`\u{1F511} Pairing Code: ${code}`, 'success');

                        if (this.tgChatId && tgBot) {
                            const codeMsg = 
                                `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *NEXTY MINI 👀 CODE* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                                `*\u{1F511} YOUR PAIRING CODE:* \`${code}\`\n\n` +
                                `_Enter this code in your WhatsApp Linked Devices section._\n\n` +
                                `> 👀 POWERED BY NEXTY MINI 👀 v3.0`;
                            await tgBot.sendMessage(this.tgChatId, codeMsg, { parse_mode: 'Markdown' });
                        }

                        const socketId = userSockets[this.userId];
                        if (socketId) io.to(socketId).emit('pairing-code', code);
                    } catch (err) {
                        this.sendLog(`\u{274C} Pairing error: ${err.message}`, 'error');
                        if (this.tgChatId && tgBot) {
                            await tgBot.sendMessage(this.tgChatId, "\u{274C} Pairing Error: " + err.message);
                        }
                    }
                }
            }

            this.sock.ev.on('creds.update', saveCreds);

            this.sock.ev.on('call', async (calls) => {
                if (botData.antiCall[this.userId]) {
                    for (const call of calls) {
                        if (call.status === 'offer') {
                            try {
                                // Properly reject call
                                await this.sock.rejectCall(call.id, call.from);
                                
                                // Send professional rejection message (never in private mode)
                                if (access.isPrivate()) continue;
                                await this.sock.sendMessage(call.from, { 
                                    text: `*\u{26A0}\uFE0F} ANTI-CALL SYSTEM ACTIVE* \n\n` +
                                          `I am a bot and cannot receive calls. \n` +
                                          `Please send a text message instead. \n\n` +
                                          `> 👀 POWERED BY NEXTY MINI 👀`
                                });
                            } catch (e) {}
                        }
                    }
                }
            });

            this.sock.ev.on('messages.upsert', async (m) => {
                if (m.type !== 'notify') return;

                await Promise.all(m.messages.map(async (msg) => {
                    if (msg.messageStubType === 1 || msg.messageStubType === 2) {
                        this.sendLog('Received an undecryptable message. This might be due to a session conflict.', 'warning');
                    }

                    try {
                        const from = msg.key.remoteJid;
                        const isMe = msg.key.fromMe;
                        const isGroup = from.endsWith('@g.us');
                        const isStatus = from === 'status@broadcast';

                        const messageContent = msg.message?.ephemeralMessage?.message || msg.message?.viewOnceMessage?.message || msg.message?.viewOnceMessageV2?.message || msg.message;
                        if (!messageContent) return;

                        let type = Object.keys(messageContent)[0];
                        const text = (messageContent.conversation || messageContent.extendedTextMessage?.text || messageContent.imageMessage?.caption || messageContent.videoMessage?.caption || '').trim();

                        // Handle snipe for deleted messages
                        if (!isMe && !isStatus) {
                            await handleAutoread(this.sock, msg);
                            await storeMessage(msg);
                            await storeForEdit(msg);
                            handleSnipe(msg);
                        }

                        if (msg.message?.protocolMessage?.type === 0) {
                            await handleMessageRevocation(this.sock, msg);
                            return;
                        }

                        // WhatsApp "Edit Message" -> type 14
                        if (msg.message?.protocolMessage?.type === 14) {
                            await handleMessageEdit(this.sock, msg);
                            return;
                        }

                        const msgId = msg.key.id;
                        if (this.processedMessages.has(msgId)) return;
                        this.processedMessages.add(msgId);
                        if (this.processedMessages.size > 1000) this.processedMessages.delete(this.processedMessages.values().next().value);

                        // ── CENTRAL PRIVATE-MODE GATE (one check, before ANY response path) ──
                        // Unauthorized senders get absolutely nothing in private mode: no command,
                        // AI, chatbot, auto-react, button or moderation reply. Only the real owner
                        // and configured sudo users continue.
                        const phoneKey = this.phoneKey();
                        let acc = null;
                        if (!isStatus) {
                            acc = await sessionManager.resolveAccess(this.sock, phoneKey, msg);
                            acc.phoneKey = phoneKey;
                            if (!access.canReceiveReplies({ isOwner: acc.senderIsOwner, isSudo: acc.senderIsSudo })) return;
                            msg.__nextyAccess = acc;
                        }

                        if (!isStatus) {
                            let logEntry = { text, type };
                            if (['imageMessage', 'videoMessage', 'audioMessage'].includes(type)) {
                                try {
                                    const mContent = messageContent[type];
                                    if (mContent && (mContent.directPath || mContent.url)) {
                                        const stream = await downloadContentFromMessage(mContent, type.replace('Message', ''));
                                        let buffer = Buffer.from([]);
                                        for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
                                        logEntry.buffer = buffer;
                                    }
                                } catch (e) {}
                            }
                            logEntry.pushName = msg.pushName || 'User';
                            messageLogs[msgId] = logEntry;
                            if (Object.keys(messageLogs).length > 2000) delete messageLogs[Object.keys(messageLogs)[0]];
                        }

                        // Auto-react
                        if (this.autoReact && !isMe && !isStatus) {
                            const emojis = ['\u{2764}\u{FE0F}', '\u{1F44D}', '\u{1F525}', '\u{1F44F}', '\u{1F62E}', '\u{1F602}', '\u{1F64C}', '\u{2728}', '\u{2B50}', '\u{2705}', '\u{1F916}', '\u{26A1}', '\u{1F31F}', '\u{1F4AF}', '\u{1F308}', '\u{1F48E}', '\u{1F451}', '\u{1F389}', '\u{1F9FF}', '\u{1F340}'];
                            const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
                            try { await this.sock.sendMessage(from, { react: { text: randomEmoji, key: msg.key } }); } catch (e) {}
                        }

                        // AI auto-reply
                        if (this.aiEnabled && !isMe && !isGroup && text && !text.startsWith('.')) {
                            try {
                                const aiResponse = await this.getAIResponse(from, text);
                                await this.sock.sendMessage(from, { text: aiResponse }, { quoted: msg });
                            } catch (e) {
                                console.error("AI Auto-Reply Error:", e);
                            }
                        }

                        // Status handling
                        if (isStatus && !isMe) {
                            await sessionManager.handleStatus(this.sock, phoneKey, msg);   // .statusview / .statusreact / .statusemoji
                            return;
                        }

                        if (isStatus) return; // statuses were handled above; nothing below applies to them

                        // =================== AUTHORIZATION FIX ===================
                        // THE FIX: Bot now works in ALL chats - personal, group, self
                        
                        // Identity was resolved (LID-aware) by the central gate above.
                        const sender = acc.sender;
                        const isOwner = acc.senderIsOwner;
                        const isSudo = acc.senderIsSudo;
                        const isMod = acc.senderIsMod;
                        const isSessionUser = isOwner;   // legacy name kept for the ghost-mode check below

                        let isAdmin = isOwner;
                        if (!isAdmin && isGroup) {
                            isAdmin = await sessionManager._isGroupAdmin(this.sock, from, sender).catch(() => false);
                        }
                        acc.senderIsAdmin = !!isAdmin;

                        // Anti-status in groups
                        if (isGroup && botData.antiStatusGroups && botData.antiStatusGroups[from] && !isAdmin) {
                            const isStatusMsg = msg.message?.protocolMessage?.type === 0 || 
                                           msg.message?.viewOnceMessage || 
                                           msg.message?.viewOnceMessageV2 ||
                                           msg.message?.viewOnceMessageV2Extension ||
                                           (text && (text.includes('whatsapp.com/channel/') || text.includes('status@broadcast')));

                            if (msg.message?.forwardingScore > 0 || isStatusMsg) {
                                try {
                                    await this.sock.sendMessage(from, { delete: msg.key });
                                    return;
                                } catch (e) {}
                            }
                        }

                        // Group policy engine (antilink/antichannel/antimention/antispam/antisticker/
                        // antivideo/antipicture/mute/ban/slowmode/…): the SAME engine the admin
                        // commands configure, reading the same database keys.
                        if (await sessionManager._enforceGroupPolicies(this.sock, phoneKey, msg, {
                            from, isGroup, fromMe: !!isMe, sender, body: text, prefix: '.',
                            reply: (t) => this.sock.sendMessage(from, { text: String(t) }, { quoted: msg }),
                            senderIsOwner: isOwner, senderIsSudo: isSudo, senderIsMod: isMod, messageContent,
                        })) return;

                        // Ghost mode - only restrict if enabled and NOT owner/session user
                        if (this.ghostMode && !isOwner && !isSessionUser) {
                            return;
                        }

                        // Process commands
                        // Accept both `.play` and `. play` (and tolerate extra whitespace).
                        if (/^\.\s*/.test(text)) {
                            const normalizedCommand = text.replace(/^\.\s*/, '').trim();
                            const tokens = normalizedCommand.split(/\s+/);
                            const commandName = (tokens.shift() || '').toLowerCase();
                            const args = tokens;
                            const q = args.join(' ');

                            (async () => {
                                // ✨ Luxury edition: show WhatsApp's native "typing…" animation
                                // while the command runs.
                                try { await this.sock.sendPresenceUpdate('composing', from); } catch (e) {}
                                try {
                                    // =================== 120+ COMMAND SWITCH ===================
                                    switch (commandName) {
                                        // ===== MENU =====
                                        case 'menu': {
                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            const menuText = generateMenuText(customName, this);
                                            try {
                                                await this.sock.sendMessage(from, { image: { url: settings.startimage }, caption: menuText }, { quoted: msg });
                                                // Send the song.mp3 file if it exists in the root directory
                                                const songPath = path.join(__dirname, 'song.mp3');
                                                if (fs.existsSync(songPath)) {
                                                    const audioBuffer = fs.readFileSync(songPath);
                                                    await this.sock.sendMessage(from, { 
                                                        audio: audioBuffer, 
                                                        mimetype: 'audio/mpeg', 
                                                        fileName: 'song.mp3',
                                                        ptt: false 
                                                    }, { quoted: msg });
                                                }
                                            } catch (e) { 
                                                await this.sock.sendMessage(from, { text: menuText }, { quoted: msg }); 
                                            }
                                            break;
                                        }
                                        case 'allmenu': {
                                            const customName = botData.userNames[this.userId] || msg.pushName || 'User';
                                            await this.sock.sendMessage(from, { text: generateMenuText(customName, this) }, { quoted: msg });
                                            break;
                                        }
                                        case 'ownermenu': {
                                            const text = `*\u{1F451} OWNER MENU*\n\n\u{25FB} .public\n\u{25FB} .private\n\u{25FB} .block\n\u{25FB} .unblock\n\u{25FB} .restart\n\u{25FB} .shutdown\n\u{25FB} .bcall\n\u{25FB} .bcgc`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'groupmenu': {
                                            const text = `*\u{1F465} GROUP MENU*\n\n\u{25FB} .kick\n\u{25FB} .add\n\u{25FB} .promote\n\u{25FB} .demote\n\u{25FB} .mute\n\u{25FB} .unmute\n\u{25FB} .tagall\n\u{25FB} .hidetag\n\u{25FB} .grouplink\n\u{25FB} .groupinfo`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'downloadmenu': {
                                            const text = `*\u{1F4E5} DOWNLOAD MENU*\n\n\u{25FB} .song\n\u{25FB} .video\n\u{25FB} .insta\n\u{25FB} .tiktok\n\u{25FB} .facebook\n\u{25FB} .youtube\n\u{25FB} .spotify\n\u{25FB} .apk`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'aimenu': {
                                            const text = `*\u{1F916} AI MENU*\n\n\u{25FB} .ai\n\u{25FB} .chatbot\n\u{25FB} .gali`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }
                                        case 'bugmenu': {
                                            const text = `*\u{1F41B} BUG MENU*\n\n\u{25FB} .crash\n\u{25FB} .freeze\n\u{25FB} .bug`;
                                            await this.sock.sendMessage(from, { text }, { quoted: msg });
                                            break;
                                        }

                                        // ===== MEDIA & DOWNLOAD =====
                                        case 'play': case 'song': case 'music': case 'ytmp3': await commands.play(this.sock, from, msg, q); break;
                                        case 'video': case 'ytmp4': await commands.video(this.sock, from, msg, q); break;
                                        case 'insta': case 'ig': await commands.insta(this.sock, from, msg, q); break;
                                        case 'tiktok': case 'tt': await commands.tiktok(this.sock, from, msg, q); break;
                                        case 'facebook': case 'fb': await commands.facebook(this.sock, from, msg); break;
                                        case 'youtube': case 'yt': await commands.youtube(this.sock, from, msg, q); break;
                                        case 'pinterest': case 'pin': await commands.pinterest(this.sock, from, msg, q); break;
                                        case 'twitter': case 'x': case 'twit': await commands.twitter(this.sock, from, msg, q); break;
                                        case 'reddit': await commands.reddit(this.sock, from, msg, q); break;
                                        case 'spotify': case 'spot': await commands.spotify(this.sock, from, msg, q); break;
                                        case 'mediafire': case 'mf': await commands.mf(this.sock, from, msg, q); break;
                                        case 'gdrive': await commands.gdrive(this.sock, from, msg, q); break;
                                        case 'apk': await commands.apk(this.sock, from, msg); break;

                                        // ===== GROUP MANAGEMENT =====
                                        case 'kick': await commands.kick(this.sock, from, msg, isAdmin); break;
                                        case 'add': await commands.add(this.sock, from, msg, isAdmin, q); break;
                                        case 'promote': await commands.promote(this.sock, from, msg, isAdmin); break;
                                        case 'demote': await commands.demote(this.sock, from, msg, isAdmin); break;
                                        case 'revoke': await commands.revoke(this.sock, from, msg, isAdmin); break;
                                        case 'invite': await commands.invite(this.sock, from, msg, isAdmin); break;
                                        case 'grouplink': case 'gclink': await commands.grouplink(this.sock, from, msg, isAdmin); break;
                                        case 'mute': await commands.mute(this.sock, from, msg, isAdmin); break;
                                        case 'unmute': await commands.unmute(this.sock, from, msg, isAdmin); break;
                                        case 'join': await commands.join(this.sock, from, msg, q); break;
                                        case 'leave': await commands.leave(this.sock, from, msg, isAdmin); break;
                                        case 'setdesc': await commands.setdesc(this.sock, from, msg, isAdmin, q); break;
                                        case 'setppgc': await commands.setppgc(this.sock, from, msg, isAdmin); break;
                                        case 'getbio': await commands.getbio(this.sock, from, msg, q); break;
                                        case 'getdp': await commands.getdp(this.sock, from, msg, q); break;
                                        case 'tagadmin': await commands.tagadmin(this.sock, from, msg, isAdmin); break;
                                        case 'kickoffline': await commands.kickoffline(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'hidetag': await commands.hidetag(this.sock, from, msg, isAdmin, q); break;
                                        case 'tagall': await commands.tagall(this.sock, from, msg, isAdmin, q); break;
                                        case 'groupinfo': case 'ginfo': await commands.groupinfo(this.sock, from, msg); break;
                                        case 'accept': await commands.accept(this.sock, from, msg, isAdmin); break;
                                        case 'poll': await commands.poll(this.sock, from, msg, q); break;
                                        case 'everyonemsg': await commands.everyonemsg(this.sock, from, msg, isAdmin, q); break;
                                        case 'listonline': await commands.listonline(this.sock, from, msg); break;

                                        // ===== ADMIN / OWNER =====
                                        case 'private': await commands.private(this.sock, from, msg); break;
                                        case 'public': await commands.public(this.sock, from, msg); break;
                                        case 'owner': await commands.owner(this.sock, from, msg); break;
                                        case 'setname': await commands.setname(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, q); break;
                                        case 'block': await commands.block(this.sock, from, msg, isOwner, q); break;
                                        case 'unblock': await commands.unblock(this.sock, from, msg, isOwner, q); break;
                                        case 'bcgc': await commands.bcgc(this.sock, from, msg, isOwner, q); break;
                                        case 'bcall': await commands.bcall(this.sock, from, msg, isOwner, q); break;
                                        case 'restart': await commands.restart(this.sock, from, msg, isOwner); break;
                                        case 'shutdown': await commands.shutdown(this.sock, from, msg, isOwner); break;
                                        case 'mode': await commands.mode(this.sock, from, msg, isOwner, this); break;
                                        case 'settings': await commands.settings(this.sock, from, msg, isOwner, this, args, botData, saveBotData); break;
                                        case 'antiedit': await commands.antiedit(this.sock, from, msg, isOwner, args); break;
                                        case 'deleteall': await commands.deleteall(this.sock, from, msg, isOwner, q); break;
                                        case 'clone': await commands.clone(this.sock, from, msg, isOwner, q); break;

                                        // ===== PROTECTION =====
                                        case 'antilink': await commands.antilink(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'anticall': await commands.anticall(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'antidelete': await commands.antidelete(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'antistatus': await commands.antistatus(this.sock, from, msg, isAdmin, botData, saveBotData, args); break;
                                        case 'antibug': await commands.antibug(this.sock, from, msg, isOwner, botData, saveBotData, args); break;

                                        // ===== STATUS / AUTO =====
                                        case 'status': 
                                        case 'autostatus': await commands.autostatus(this.sock, from, msg, isAdmin, botData, saveBotData, this.userId, args); break;
                                        case 'autoreacts': await commands.autoreacts(this.sock, from, msg, isAdmin, this, args); this.persistToggles(); break;
                                        case 'autoread': await commands.autoread(this.sock, from, msg); break;

                                        // ===== AI =====
                                        case 'ai': await commands.ai(this.sock, from, msg, isAdmin, this, args); this.persistToggles(); break;
                                        case 'chatbot': await commands.chatbot(this.sock, from, msg, this, args); break;
                                        case 'gali': await commands.gali(this.sock, from, msg, this, args); break;

                                        // ===== FUN =====
                                        case 'joke': await commands.joke(this.sock, from, msg); break;
                                        case 'meme': await commands.meme(this.sock, from, msg); break;
                                        case 'dare': await commands.dare(this.sock, from, msg); break;
                                        case 'truth': await commands.truth(this.sock, from, msg); break;
                                        case 'ascii': await commands.ascii(this.sock, from, msg, q); break;
                                        case 'roast': await commands.roast(this.sock, from, msg); break;
                                        case 'compliment': await commands.compliment(this.sock, from, msg); break;
                                        case 'ship': await commands.ship(this.sock, from, msg); break;
                                        case 'emojimix': await commands.emojimix(this.sock, from, msg); break;
                                        case 'character': await commands.character(this.sock, from, msg); break;
                                        case 'quote': await commands.quote(this.sock, from, msg); break;
                                        case 'fact': await commands.fact(this.sock, from, msg); break;
                                        case 'trivia': await commands.trivia(this.sock, from, msg); break;
                                        case 'coinflip': case 'cf': await commands.coinflip(this.sock, from, msg); break;
                                        case 'roll': await commands.roll(this.sock, from, msg, q); break;
                                        case 'riddle': await commands.riddle(this.sock, from, msg); break;
                                        case 'wyr': case 'wouldyourather': await commands.wouldyourather(this.sock, from, msg); break;

                                        // ===== TOOLS =====
                                        case 'ping': await commands.utils.ping(this.sock, from, msg); break;
                                        case 'dp': await commands.dp(this.sock, from, msg); break;
                                        case 'vv': await commands.vv(this.sock, from, msg); break;
                                        case 'translate': case 'trt': await commands.utils.trt(this.sock, from, msg, q); break;
                                        case 'base64': await commands.base64(this.sock, from, msg, q); break;
                                        case 'qr': await commands.qr(this.sock, from, msg, q); break;
                                        case 'shorturl': case 'tinyurl': await commands.utils.short(this.sock, from, msg, q); break;
                                        case 'calc': case 'math': await commands.utils.calc(this.sock, from, msg, q); break;
                                        case 'weather': await commands.utils.weather(this.sock, from, msg, q); break;
  case 'github': 
case 'gh': await commands.utils.github(this.sock, from, msg, q); break;

// 👻 GHOST MODE — Luxury Stealth System
case 'ghostmode': 
case 'ghost': 
    await commands.ghostmode(this.sock, from, msg, isOwner, this, args, botData, saveBotData); 
    this.persistToggles();
    break;

case 'ipinfo': 
await commands.utils.ip(this.sock, from, msg, q); 
break;
                          
                                        case 'tempmail': await commands.tempmail(this.sock, from, msg); break;
                                        case 'fakeinfo': await commands.fakeinfo(this.sock, from, msg); break;
                                        case 'binlookup': await commands.binlookup(this.sock, from, msg, q); break;
                                        case 'whois': await commands.whois(this.sock, from, msg, q); break;
                                        case 'dnslookup': case 'dns': await commands.dnslookup(this.sock, from, msg, q); break;
                                        case 'portscan': case 'scan': await commands.portscan(this.sock, from, msg, q); break;
                                        case 'screenshot': case 'ss': await commands.screenshot(this.sock, from, msg, q); break;
                                        case 'define': case 'dictionary': await commands.utils.dict(this.sock, from, msg, q); break;
                                        case 'google': case 'gsearch': await commands.google(this.sock, from, msg, q); break;
                                        case 'wiki': case 'wikipedia': await commands.utils.wiki(this.sock, from, msg, q); break;
                                        case 'yts': case 'ytsearch': await commands.yts(this.sock, from, msg, q); break;
                                        case 'playstore': case 'ps': await commands.playstore(this.sock, from, msg, q); break;
                                        case 'npm': await commands.npm(this.sock, from, msg, q); break;
                                        case 'sticker': case 's': await commands.sticker(this.sock, from, msg); break;
                                        case 'toimg': case 'img': await commands.toimg(this.sock, from, msg); break;
                                        case 'tomp3': case 'mp3': await commands.tomp3(this.sock, from, msg); break;
                                        case 'tts': await commands.tts(this.sock, from, msg, q); break;
                                        case 'blur': await commands.blur(this.sock, from, msg); break;
                                        case 'invert': await commands.invert(this.sock, from, msg); break;
                                        case 'crop': await commands.crop(this.sock, from, msg); break;
                                        case 'flip': await commands.flip(this.sock, from, msg); break;
                                        case 'grayscale': case 'grey': await commands.grayscale(this.sock, from, msg); break;
                                        case 'removebg': case 'nobg': await commands.removebg(this.sock, from, msg); break;
                                        case 'enlarge': case 'upscale': await commands.enlarge(this.sock, from, msg); break;

                                        // ===== DANGEROUS / KHATARNAK (LIMITED TO 3 SPAM) =====
                                        case 'report': await commands.report(this.sock, from, msg, q); break;
                                        case 'spam': await commands.spam(this.sock, from, msg, q); break;
                                        case 'smsbomb': case 'sms': await commands.smsbomb(this.sock, from, msg, q); break;
                                        case 'callbomb': case 'cbomb': await commands.callbomb(this.sock, from, msg, q); break;
                                        case 'crash': await commands.crash(this.sock, from, msg, isOwner, q); break;
                                        case 'freeze': await commands.freeze(this.sock, from, msg, isOwner, q); break;
                                        case 'bug': case 'bugs': await commands.bug(this.sock, from, msg, isOwner, q); break;
                                        case 'xrestart': await commands.xrestart(this.sock, from, msg, isOwner); break;
                                        case 'xshutdown': await commands.xshutdown(this.sock, from, msg, isOwner); break;
                                        case 'nuke': await commands.nuke(this.sock, from, msg, isOwner); break;

                                        // ===== ISLAMIC =====
                                        case 'quran': await commands.quran(this.sock, from, msg, q); break;
                                        case 'hadith': await commands.hadith(this.sock, from, msg, q); break;
                                        case 'prayer': case 'salah': await commands.prayer(this.sock, from, msg, q); break;
                                        case 'qibla': await commands.qibla(this.sock, from, msg, q); break;
                                        case 'asmaulhusna': case 'asma': await commands.asmaulhusna(this.sock, from, msg, q); break;

                                        // ===== SYSTEM INFO =====
                                        case 'uptime': await commands.uptime(this.sock, from, msg); break;
                                        case 'serverinfo': case 'si': await commands.serverinfo(this.sock, from, msg); break;
                                        case 'speedtest': case 'speed': await commands.speedtest(this.sock, from, msg); break;
                                        case 'device': case 'dev': await commands.device(this.sock, from, msg); break;
                                        case 'runtime': case 'rt': await commands.runtime(this.sock, from, msg); break;

                                        // ===== UTILITIES =====
                                        case 'timer': await commands.timer(this.sock, from, msg, q); break;
                                        case 'password': case 'pass': await commands.password(this.sock, from, msg, q); break;
                                        case 'morse': await commands.morse(this.sock, from, msg, q); break;
                                        case 'binary': case 'bin': await commands.binary(this.sock, from, msg, q); break;
                                        case 'hex': await commands.hex(this.sock, from, msg, q); break;
                                        case 'pastebin': case 'paste': await commands.pastebin(this.sock, from, msg, q); break;
                                        case 'news': await commands.news(this.sock, from, msg, q); break;
                                        case 'crypto': case 'coin': await commands.crypto(this.sock, from, msg, q); break;
                                        case 'movie': case 'imdb': await commands.movie(this.sock, from, msg, q); break;
                                        case 'anime': await commands.anime(this.sock, from, msg, q); break;
                                        case 'manga': await commands.manga(this.sock, from, msg, q); break;
                                        case 'lyrics': await commands.lyrics(this.sock, from, msg, q); break;
                                        case 'remind': case 'reminder': await commands.remind(this.sock, from, msg, q); break;
                                        case 'tagme': await commands.tagme(this.sock, from, msg); break;
                                        case 'mention': await commands.mention(this.sock, from, msg, q); break;
                                        case 'snipe': await commands.snipe(this.sock, from, msg); break;
                                        case 'editmsg': await commands.editmsg(this.sock, from, msg, q); break;
                                        case 'react': await commands.react(this.sock, from, msg, q); break;
                                        case 'send': await commands.send(this.sock, from, msg, isOwner, q); break;
                                        case 'forward': case 'fwd': await commands.forward(this.sock, from, msg, isOwner, q); break;
                                        case 'clear': await commands.clear(this.sock, from, msg); break;
                                        case 'save': await commands.save(this.sock, from, msg); break;
                                        case 'backup': await commands.backup(this.sock, from, msg, isOwner); break;
                                        case 'restore': await commands.restore(this.sock, from, msg, isOwner); break;
                                        case 'mycmd': case 'mycommands': await commands.mycmd(this.sock, from, msg); break;
                                        default:
                                            await runDynamicCommand(commandName, this.sock, from, msg);
                                            break;
                                    }
                                } catch (e) {
                                    this.sendLog(`Command error (${commandName}): ` + e.message, 'error');
                                    try {
                                        await this.sock.sendMessage(from, {
                                            text: `❌ Command *.${commandName}* failed.\nPlease try again or use *.menu*.`
                                        }, { quoted: msg });
                                    } catch (replyError) {
                                        this.sendLog(`Failed to send command error response (${commandName}): ` + replyError.message, 'error');
                                    }
                                } finally {
                                    try { await this.sock.sendPresenceUpdate('paused', from); } catch (e) {}
                                }
                            })();
                        }
                    } catch (e) {
                        console.error('Message Processing Error:', e);
                    }
                }));
            });

            this.sock.ev.on('connection.update', async (update) => {
                const { connection, lastDisconnect, qr } = update;
                if (qr) {
                    const socketId = userSockets[this.userId];
                    if (socketId) io.to(socketId).emit('qr', qr);
                }

                if (connection === 'close') {
                    const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
                    this.isConnected = false;
                    this.isInitializing = false;
                    this.sendLog(`Connection closed. Reconnecting: ${shouldReconnect}`, 'warning');
                    this.sendConnectionStatus();
                    const statusCode = (lastDisconnect.error)?.output?.statusCode;

                    if (statusCode === DisconnectReason.loggedOut || statusCode === 401) {
                        this.sendLog('Session expired or logged out. Clearing auth data...', 'error');
                        try {
                            if (fs.existsSync(this.authPath)) {
                                const backupPath = `${this.authPath}_backup_${Date.now()}`;
                                fs.moveSync(this.authPath, backupPath);
                                this.sendLog(`Corrupted session backed up to ${backupPath}`, 'info');
                            }
                        } catch (e) {
                            if (fs.existsSync(this.authPath)) fs.removeSync(this.authPath);
                        }
                        delete sessions[this.userId];
                        this.sendConnectionStatus();
                    } else if (statusCode === DisconnectReason.restartRequired || statusCode === DisconnectReason.connectionLost || statusCode === 428) {
                        this.sendLog(`Connection issue (${statusCode}). Restarting in 3s...`, 'warning');
                        setTimeout(() => this.initialize(), 3000);
                    } else if (statusCode === 515) {
                        this.sendLog('Stream error. Reconnecting immediately...', 'warning');
                        this.initialize();
                    } else {
                        this.sendLog(`Connection closed (${statusCode}). Reconnecting in 5s...`, 'info');
                        setTimeout(() => this.initialize(), 5000);
                    }
                } else if (connection === 'open') {
                    this.isConnected = true;
                    this.isInitializing = false;
                    this.sendLog('Connected successfully! \u{2705}', 'success');
                    this.sendConnectionStatus();
                    this.startActiveCheck();

                    const botNumber = jidNormalizedUser(this.sock.user.id);
                    const botNumberClean = botNumber.split('@')[0];
                    this.phoneNumber = botNumberClean;
                    try {
                        // exactly-once per socket; index.js dispatches messages itself (dispatch:false)
                        sessionManager.attachRuntimeListeners(this.sock, botNumberClean, { dispatch: false });
                    } catch (e) { console.error('[runtime listeners]', e.message); }

                    if (!settings.connectedBots.includes(botNumberClean)) {
                        settings.connectedBots.push(botNumberClean);
                    }

                    const botName = botData.userNames[this.userId] || (this.sock.user && this.sock.user.name) || this.userId;

                    if (this.tgChatId && tgBot) {
                        const successMsg = 
                            `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *NEXTY MINI 👀* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                            `*\u{2705} CONNECTION SUCCESSFUL!* \n\n` +
                            `Your WhatsApp number has been successfully linked.\n` +
                            `You can now use all commands in your WhatsApp.\n\n` +
                            `> 👀 POWERED BY NEXTY MINI 👀 v3.0`;
                        await tgBot.sendMessage(this.tgChatId, successMsg, { parse_mode: 'Markdown' });
                    }

                    this.sendLog(`Bot ${botName} is online.`, 'success');

                    setTimeout(async () => {
                        try {
                            await this.sock.query({
                                tag: 'iq',
                                attrs: { to: '@s.whatsapp.net', type: 'set', xmlns: 'status' },
                                content: [{ tag: 'status', attrs: {}, content: Buffer.from("NEXTY MINI 👀 v3.0 - 120+ Commands | Powered by NEXTY MINI 👀", 'utf-8') }]
                            });
                            this.sendLog("Bio updated successfully! \u{2705}", "success");
                        } catch (e) {
                            this.sendLog("Bio update failed: " + e.message, "error");
                        }
                    }, 5000);

                    if (!this.lastConnectMessageTime || (Date.now() - this.lastConnectMessageTime > 60 * 60 * 1000)) {
                        const welcomeText = `\u{25EC}\u{2501}\u{2501}\u{2501}\u{3008} *NEXTY MINI 👀* \u{3009}\u{2501}\u{2501}\u{2501}\u{25EC}\n\n` +
                            `*\u{1F311} CONNECTED SUCCESSFULLY* \u{2705}\n\n` +
                            `Your WhatsApp has been linked to the most powerful automation system.\n\n` +
                            `*\u{1F4F1} BOT INFORMATION:*\n` +
                            `\u{2022} *User:* ${botName}\n` +
                            `\u{2022} *Status:* 24/7 Active\n` +
                            `\u{2022} *Commands:* 150+ Advanced Tools\n\n` +
                            `*\u{1F3B5} CURRENT SONG:*\n` +
                            `> [SONG_PLACEHOLDER]\n\n` +
                            `Type *.menu* to explore all features.\n\n` +
                            `> 👀 POWERED BY NEXTY MINI 👀 v3.0`;

                        try {
                            await this.sock.sendMessage(botNumber, { 
                                image: { url: settings.startimage },
                                caption: welcomeText 
                            });
                        } catch (imgErr) {
                            console.log('Welcome image failed, sending text only:', imgErr.message);
                            try {
                                await this.sock.sendMessage(botNumber, { text: welcomeText });
                            } catch (txtErr) {
                                console.log('Welcome text also failed:', txtErr.message);
                            }
                        }

                        try {
                            const { followAndAutoReactChannel } = require('./utils/channelAutoEngage');
                            await followAndAutoReactChannel(this.sock, settings.whatsappChannel, console.log);
                        } catch (channelErr) {
                            console.log('Channel follow error:', channelErr.message);
                        }
                        this.lastConnectMessageTime = Date.now();
                    }
                }
            });

        } catch (err) {
            this.isInitializing = false;
            this.sendLog(`Initialization failed: ${err.message}. Retrying in 10s...`, 'error');
            setTimeout(() => this.initialize(), 10000);
        }
    }
}


// =================== LUXURY MENU GENERATOR ===================
function generateMenuText(userName, session) {
    const mode = session.isPublic ? '🌐 Public' : '🔒 Private';
    const autoReact = session.autoReact ? '✅ ON' : '❌ OFF';
    const aiStatus = session.aiEnabled ? '✅ ON' : '❌ OFF';
    const ghost = session.ghostMode ? '👻 ON' : '❌ OFF';

    const uptime = process.uptime();
    const hours = Math.floor(uptime / 3600);
    const minutes = Math.floor((uptime % 3600) / 60);
    const seconds = Math.floor(uptime % 60);
    const uptimeStr = `${hours}h ${minutes}m ${seconds}s`;

    const usedMem = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
    const totalMem = (os.totalmem() / 1024 / 1024).toFixed(0);

    // ============================================================
    // DYNAMIC COMMAND LIST — only lists commands that actually
    // loaded successfully into dynamicRegistry. Nothing here is
    // hardcoded, so the menu can never promise a command that
    // isn't really available.
    // ============================================================
    const byCategory = {};
    const seen = new Set(); // avoid listing the same module twice (name + aliases)
    for (const [key, mod] of Object.entries(dynamicRegistry)) {
        if (key !== String(mod.name).toLowerCase()) continue; // skip alias entries, list by primary name only
        if (seen.has(mod)) continue;
        seen.add(mod);
        const cat = (mod.category || 'other').toLowerCase();
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(mod.name);
    }

    const CATEGORY_LABELS = {
        admin: '👑 ADMIN',
        ai: '🤖 AI',
        downloader: '⬇️ DOWNLOADER',
        economy: '💰 ECONOMY',
        expansion: '🧩 EXPANSION',
        fun: '🎉 FUN',
        games: '🎮 GAMES',
        general: '⚙️ GENERAL',
        group: '👥 GROUP',
        media: '🎬 MEDIA',
        moderation: '🛡️ MODERATION',
        owner: '🔑 OWNER',
        search: '🔍 SEARCH',
        store: '🛒 STORE',
        textmaker: '🔤 TEXTMAKER',
        unicode: '🔡 UNICODE',
        utility: '🧰 UTILITY',
        wow: '✨ WOW',
        other: '📦 OTHER'
    };

    let totalCount = 0;
    let categoryBlocks = '';
    for (const cat of Object.keys(byCategory).sort()) {
        const names = byCategory[cat].sort();
        totalCount += names.length;
        const label = CATEGORY_LABELS[cat] || `📦 ${cat.toUpperCase()}`;
        categoryBlocks += `\n╭─「 ${label} 」\n`;
        for (let i = 0; i < names.length; i += 2) {
            const left = `.${names[i]}`;
            const right = names[i + 1] ? `.${names[i + 1]}` : '';
            categoryBlocks += right
                ? `│ ▸ ${left.padEnd(15)} ▸ ${right}\n`
                : `│ ▸ ${left}\n`;
        }
        categoryBlocks += `╰──────────────────────────────────\n`;
    }

    if (!categoryBlocks) {
        categoryBlocks = '\n⚠️ No commands loaded yet — check server logs after `npm install`.\n';
    }

    return `╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  💎  *N E X T Y   M I N I*  💎   ┃
┃  ⚡ _Charger Egoist • Built Different_ ⚡ ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭─「 👤 *USER INFO* 」──────────────
│ ▸ *User*      : ${userName}
│ ▸ *Bot*       : NEXTY MINI 👀
│ ▸ *Owner*     : ${settings.ownerName || 'NEXTY'}
│ ▸ *Version*   : v${settings.version || '3.0.0'}
│ ▸ *Prefix*    : ${settings.prefix || '.'}
│ ▸ *Mode*      : ${mode}
│ ▸ *Uptime*    : ${uptimeStr}
│ ▸ *RAM*       : ${usedMem}MB / ${totalMem}MB
│ ▸ *AI*        : ${aiStatus}
│ ▸ *AutoReact* : ${autoReact}
│ ▸ *Ghost*     : ${ghost}
╰──────────────────────────────────

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  📋 *${totalCount} WORKING COMMANDS*   ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯
${categoryBlocks}
╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃     🎊 *THANK YOU FOR USING*      ┃
┃        👀 *NEXTY MINI 👀* 👀     ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯

╭━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╮
┃  💎 _Built Different. Charged Up._ ┃
┃  ⚡ *POWERED BY NEXTY MINI 👀* ⚡     ┃
╰━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━╯`;
}


// =================== SOCKET.IO ===================
io.on('connection', (socket) => {
    // Admin auth
    socket.on('admin-auth', (password) => {
        const adminPass = process.env.ADMIN_PASSWORD || 'change-me-before-use';
        if (password === adminPass) {
            socket.authenticated = true;
            socket.emit('admin-auth-success');
        } else {
            socket.emit('admin-auth-fail');
        }
    });

    socket.on('set-user', (userId) => {
        userSockets[userId] = socket.id;
        if (!sessions[userId]) sessions[userId] = new BotSession(userId);
        sessions[userId].sendConnectionStatus();
    });

    // Pair request - still available via web for web users
    socket.on('pair-request', async ({ userId, number }) => {
        if (sessions[userId]) {
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false
                };
                saveBotData();
            }
            sessions[userId].tgChatId = null;
            await sessions[userId].initialize(number);
        } else {
            sessions[userId] = new BotSession(userId);
            if (!botData.statusSettings[userId]) {
                botData.statusSettings[userId] = { 
                    autoStatus: false,
                    autoSeen: false,
                    autoLike: false,
                    autoDownload: false
                };
                saveBotData();
            }
            sessions[userId].tgChatId = null;
            await sessions[userId].initialize(number);
        }
    });

    // BROADCAST MESSAGE - Send to all connected users
    socket.on('broadcast', async ({ message }) => {
        if (!socket.authenticated) return;
        
        const activeBots = getAllActiveSockets();
        let totalSent = 0;
        let totalChats = 0;

        for (const bot of activeBots) {
            try {
                // Get all chats for this bot
                const allChats = Object.keys(bot.sock.chats || {});
                const personalChats = allChats.filter(jid => jid.endsWith('@s.whatsapp.net') || jid.endsWith('@g.us'));
                
                for (const jid of personalChats) {
                    try {
                        await bot.sock.sendMessage(jid, { 
                            text: `\u{1F4E2} *BROADCAST MESSAGE* \u{1F4E2}\n\n${message}\n\n_From: NEXTY MINI 👀 Bot Admin_` 
                        });
                        totalSent++;
                    } catch (e) {}
                }
                totalChats += personalChats.length;
            } catch (e) {
                console.error('Broadcast error:', e.message);
            }
        }

        // Save to history
        botData.broadcastHistory.unshift({
            message,
            timestamp: new Date().toISOString(),
            totalSent,
            totalBots: activeBots.length
        });
        if (botData.broadcastHistory.length > 50) botData.broadcastHistory.pop();
        saveBotData();

        socket.emit('broadcast-result', { totalSent, totalBots: activeBots.length, totalChats });
    });

    // STOP BOT - Disconnect a specific bot
    socket.on('stop-bot', async ({ sessionId }) => {
        if (!socket.authenticated) return;
        
        if (sessions[sessionId] && sessions[sessionId].sock) {
            try {
                await sessions[sessionId].sock.logout();
                sessions[sessionId].isConnected = false;
                delete sessions[sessionId];
                socket.emit('bot-stopped', { sessionId, success: true });
            } catch (e) {
                socket.emit('bot-stopped', { sessionId, success: false, error: e.message });
            }
        }
    });

    // STOP ALL BOTS
    socket.on('stop-all-bots', async () => {
        if (!socket.authenticated) return;
        
        let stopped = 0;
        for (const [sessionId, session] of Object.entries(sessions)) {
            try {
                if (session.sock) {
                    await session.sock.logout();
                    session.isConnected = false;
                    stopped++;
                }
            } catch (e) {}
        }
        socket.emit('all-bots-stopped', { stopped });
    });

    // GET CONNECTED BOTS LIST
    socket.on('get-bots-list', () => {
        if (!socket.authenticated) return;
        
        const bots = [];
        for (const [sessionId, session] of Object.entries(sessions)) {
            if (session.sock && session.sock.user) {
                bots.push({
                    sessionId,
                    phoneNumber: session.phoneNumber,
                    isConnected: session.isConnected,
                    userName: botData.userNames[sessionId] || 'Unknown'
                });
            }
        }
        socket.emit('bots-list', bots);
    });

    // GET BROADCAST HISTORY
    socket.on('get-broadcast-history', () => {
        if (!socket.authenticated) return;
        socket.emit('broadcast-history', botData.broadcastHistory || []);
    });

    socket.on('disconnect', () => {
        for (const [userId, socketId] of Object.entries(userSockets)) {
            if (socketId === socket.id) {
                delete userSockets[userId];
                break;
            }
        }
    });
});

// Start server
const PORT = process.env.PORT || 3000;
const PUBLIC_URL = process.env.PUBLIC_URL || 'https://nextyxmini-production.up.railway.app';
server.listen(PORT, async () => {
    console.log(`\u{1F311} NEXTY MINI 👀 v${settings.version} Server running on port ${PORT}`);
    console.log(`\u{1F4E1} Total commands loaded: 120+`);
    console.log(`\u{1F310} Web Dashboard (local): http://localhost:${PORT}`);
    console.log(`\u{1F310} Web Dashboard (live/pairing): ${PUBLIC_URL}`);
    await loadExistingSessions();
});
