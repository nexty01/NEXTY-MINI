/**
 * gameLobby.js — shared registry of active per-chat games for the .join command.
 *
 * Each game module (wcg, ttt, …) registers itself here so a single .join command
 * can route the joining player to the right game without coupling the modules.
 */
'use strict';

// chatId → { kind: 'wcg'|'ttt', addPlayer(jid)→{ok,reason,started?}, hasPlayer(jid)→bool, isFull()→bool }
const lobbies = new Map();

function open(chatId, kind, handle) {
    lobbies.set(chatId, { kind, ...handle });
}

function close(chatId) {
    lobbies.delete(chatId);
}

function get(chatId) {
    return lobbies.get(chatId) || null;
}

module.exports = { open, close, get };
