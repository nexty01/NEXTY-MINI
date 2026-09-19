/**
 * WCG — Word Chain Game · multiplayer, timed turns, canvas cards.
 *
 * Lobby:
 *   .wcg            — open a 30s lobby
 *   .join  | reply "join"  — join the lobby (handled by commands/fun/join.js)
 *
 * Game:
 *   .wcg <word>     — submit a word on your turn (30s timer)
 *   .wcg score      — live scoreboard
 *   .wcg stop       — starter/owner ends the game
 */

'use strict';

const lobbyRegistry = require('../../lib/gameLobby');
const {
    renderWcgLobbyCard,
    renderWcgTurnCard,
    renderWcgWinCard,
} = require('../../utils/canvasRender');

const TURN_MS  = 30_000;
const LOBBY_MS = 30_000;
const STARTERS = [
    'apple','brave','cool','dance','eagle','flame','gold','hero','iron',
    'jump','king','light','magic','night','orange','power','queen',
    'river','stone','tiger','ultra','vine','water','xenon','yellow','zebra',
];

// chatId → game
const games = new Map();

function makePlayer(jid) {
    return { jid, eliminated: false };
}

function clearTimers(game) {
    if (game._lobbyTimer) { clearTimeout(game._lobbyTimer); game._lobbyTimer = null; }
    if (game._turnTimer)  { clearTimeout(game._turnTimer);  game._turnTimer  = null; }
}

function alivePlayers(game) {
    return game.players.filter(p => !p.eliminated);
}

function nextTurnIndex(game) {
    const n = game.players.length;
    for (let step = 1; step <= n; step++) {
        const idx = (game.turnIdx + step) % n;
        if (!game.players[idx].eliminated) return idx;
    }
    return -1;
}

async function sendLobbyCard(sock, from, game) {
    const secondsLeft = Math.max(0, Math.ceil((game.lobbyDeadline - Date.now()) / 1000));
    const buf = await renderWcgLobbyCard({ players: game.players, secondsLeft });
    const mentions = game.players.map(p => p.jid);
    return sock.sendMessage(from, {
        image: buf,
        caption: `🔗 *Word Chain* — lobby open. Type *.join* or reply "*join*". Starts in ${secondsLeft}s.`,
        mentions,
    });
}

async function sendTurnCard(sock, from, game, lastResultText = '') {
    const secondsLeft = Math.max(0, Math.ceil((game.turnDeadline - Date.now()) / 1000));
    const cur = game.players[game.turnIdx];
    const buf = await renderWcgTurnCard({
        currentPlayer:   cur.jid,
        requiredLetter:  game.currentWord.slice(-1),
        chainLen:        game.chain.length - 1,
        lastWord:        game.currentWord,
        secondsLeft,
        players:         game.players,
    });
    return sock.sendMessage(from, {
        image: buf,
        caption: (lastResultText ? lastResultText + '\n\n' : '') +
                 `🎯 @${cur.jid.split('@')[0]} — your move (.wcg <word>)`,
        mentions: [cur.jid],
    });
}

async function sendWinCard(sock, from, game, winnerJid) {
    let longestWord = '';
    for (const e of game.chain) {
        if (e.sender !== 'BOT' && e.word.length > longestWord.length) longestWord = e.word;
    }
    const buf = await renderWcgWinCard({
        winner: winnerJid,
        players: game.players,
        chainLen: game.chain.length - 1,
        longestWord,
    });
    return sock.sendMessage(from, {
        image: buf,
        caption: winnerJid
            ? `🏆 @${winnerJid.split('@')[0]} wins the Word Chain!`
            : `🏁 Word Chain ended — no winner.`,
        mentions: game.players.map(p => p.jid),
    });
}

function startTurnTimer(sock, from, game) {
    if (game._turnTimer) clearTimeout(game._turnTimer);
    game.turnDeadline = Date.now() + TURN_MS;
    game._turnTimer = setTimeout(async () => {
        try {
            const cur = game.players[game.turnIdx];
            if (!cur || cur.eliminated) return;
            cur.eliminated = true;
            const remaining = alivePlayers(game);
            if (remaining.length <= 1) {
                clearTimers(game);
                lobbyRegistry.close(from);
                games.delete(from);
                const winner = remaining[0]?.jid || null;
                await sendWinCard(sock, from, game, winner);
                return;
            }
            game.turnIdx = nextTurnIndex(game);
            startTurnTimer(sock, from, game);
            await sendTurnCard(sock, from, game,
                `⏰ @${cur.jid.split('@')[0]} ran out of time — ELIMINATED.`);
        } catch (e) { console.error('[wcg-turn-timeout]', e.message); }
    }, TURN_MS);
}

async function startGame(sock, from, msg) {
    const game = games.get(from);
    if (!game || game.state !== 'lobby') return;
    clearTimers(game);
    if (game.players.length < 2) {
        games.delete(from);
        lobbyRegistry.close(from);
        await sock.sendMessage(from, {
            text: `❌ *Word Chain cancelled* — need at least 2 players.`,
        }, { quoted: msg });
        return;
    }
    game.state = 'playing';
    game.turnIdx = 0;
    const word = STARTERS[Math.floor(Math.random() * STARTERS.length)];
    game.currentWord = word;
    game.usedWords = new Set([word]);
    game.chain = [{ word, sender: 'BOT' }];
    lobbyRegistry.close(from); // lobby is over
    startTurnTimer(sock, from, game);
    await sendTurnCard(sock, from, game,
        `🎮 *Word Chain begins!* Bot starts with *${word}*.`);
}

function registerLobby(sock, from, game) {
    lobbyRegistry.open(from, 'wcg', {
        hasPlayer: (jid) => game.players.some(p => p.jid === jid),
        isFull:    () => false,
        addPlayer: async (jid) => {
            if (game.state !== 'lobby') return { ok: false, reason: 'closed' };
            if (game.players.some(p => p.jid === jid)) return { ok: false, reason: 'already' };
            game.players.push(makePlayer(jid));
            try { await sendLobbyCard(sock, from, game); } catch {}
            return { ok: true, kind: 'wcg' };
        },
    });
}

module.exports = {
    name:        'wcg',
    aliases:     ['wordchain', 'wc'],
    description: 'Word Chain Game — multiplayer, timed turns, canvas cards',
    usage:       '.wcg | .wcg <word> | .wcg score | .wcg stop',
    category:    'fun',

    // Exposed so commands/fun/join.js can also reach the lobby directly if needed
    _games: games,

    async execute({ sock, msg, from, sender, args, reply }) {
        const sub  = (args[0] || '').toLowerCase().trim();
        const game = games.get(from);

        // ── STOP ──────────────────────────────────────────────────────────────
        if (sub === 'stop' || sub === 'end') {
            if (!game) return reply(`❌ *No active Word Chain Game.*`);
            if (game.startedBy !== sender) {
                return reply(`🔒 Only the player who started this game can stop it.`);
            }
            clearTimers(game);
            lobbyRegistry.close(from);
            games.delete(from);
            return await sendWinCard(sock, from, game, null);
        }

        // ── SCORE ─────────────────────────────────────────────────────────────
        if (sub === 'score' || sub === 'scores' || sub === 'status') {
            if (!game) return reply(`❌ *No active game.* Start with *.wcg*`);
            if (game.state === 'lobby') return await sendLobbyCard(sock, from, game);
            return await sendTurnCard(sock, from, game, `📊 *Scoreboard*`);
        }

        // ── START / OPEN LOBBY ────────────────────────────────────────────────
        if (!sub || sub === 'start') {
            if (game) {
                if (game.state === 'lobby') return await sendLobbyCard(sock, from, game);
                return await sendTurnCard(sock, from, game, `🔗 *A game is already running.*`);
            }
            const newGame = {
                state: 'lobby',
                startedBy: sender,
                players: [makePlayer(sender)],
                lobbyDeadline: Date.now() + LOBBY_MS,
                turnIdx: 0,
                currentWord: '',
                usedWords: new Set(),
                chain: [],
                _lobbyTimer: null,
                _turnTimer:  null,
            };
            games.set(from, newGame);
            registerLobby(sock, from, newGame);
            newGame._lobbyTimer = setTimeout(() => startGame(sock, from, msg).catch(e => console.error('[wcg-lobby]', e.message)), LOBBY_MS);
            await sendLobbyCard(sock, from, newGame);
            return;
        }

        // ── WORD SUBMISSION ───────────────────────────────────────────────────
        if (!game || game.state !== 'playing') {
            return reply(`❌ *No active Word Chain Game.* Open one with *.wcg*`);
        }

        const cur = game.players[game.turnIdx];
        if (cur.jid !== sender) {
            return reply(`⏳ It's @${cur.jid.split('@')[0]}'s turn — wait for it.`);
        }

        const word = sub.replace(/[^a-z]/gi, '').toLowerCase();
        if (!word || word.length < 2) {
            return reply(`❌ *Please send a valid word (at least 2 letters).*`);
        }

        const required = game.currentWord.slice(-1).toLowerCase();
        const fail = (why) => {
            cur.eliminated = true;
            const remaining = alivePlayers(game);
            if (remaining.length <= 1) {
                clearTimers(game);
                games.delete(from);
                lobbyRegistry.close(from);
                return sendWinCard(sock, from, game, remaining[0]?.jid || null);
            }
            game.turnIdx = nextTurnIndex(game);
            startTurnTimer(sock, from, game);
            return sendTurnCard(sock, from, game, `💥 @${cur.jid.split('@')[0]} ${why} — ELIMINATED.`);
        };

        if (word[0] !== required) return await fail(`played "${word}" (needed *${required.toUpperCase()}*)`);
        if (game.usedWords.has(word)) return await fail(`repeated "${word}"`);

        // ✅ Valid word
        game.usedWords.add(word);
        game.chain.push({ word, sender });
        game.currentWord = word;
        game.turnIdx = nextTurnIndex(game);
        if (game.turnIdx < 0) {
            // shouldn't happen but be safe
            clearTimers(game);
            games.delete(from);
            lobbyRegistry.close(from);
            return await sendWinCard(sock, from, game, sender);
        }
        startTurnTimer(sock, from, game);
        await sendTurnCard(sock, from, game,
            `✅ @${sender.split('@')[0]} → *${word}*`);
    },
};
