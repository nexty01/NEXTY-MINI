/**
 * .join — join the active game lobby (WCG / TTT) in this chat.
 * Also dispatched (from sessionManager) when the user replies to the bot
 * with the bare word "join".
 */
'use strict';

const lobbyRegistry = require('../../lib/gameLobby');

module.exports = {
    name:        'join',
    aliases:     [],
    description: 'Join an active game lobby in this chat',
    usage:       '.join',
    category:    'fun',

    async execute({ sock, msg, from, sender, reply }) {
        const lobby = lobbyRegistry.get(from);
        if (!lobby) {
            return reply(`❌ *No open game lobby here.* Try *.wcg* or *.ttt* to start one.`);
        }
        if (lobby.hasPlayer(sender)) {
            return reply(`✅ You're already in the *${lobby.kind.toUpperCase()}* lobby.`);
        }
        if (lobby.isFull && lobby.isFull()) {
            return reply(`❌ *${lobby.kind.toUpperCase()} lobby is full.*`);
        }
        const res = await lobby.addPlayer(sender);
        if (res?.ok) {
            return await sock.sendMessage(from, {
                text: `🎮 @${sender.split('@')[0]} *joined the ${lobby.kind.toUpperCase()} game!*`,
                mentions: [sender],
            }, { quoted: msg });
        }
        if (res?.reason === 'already') return reply(`✅ You're already in the lobby.`);
        if (res?.reason === 'full')    return reply(`❌ Lobby is full.`);
        if (res?.reason === 'closed')  return reply(`❌ Lobby already closed.`);
        return reply(`❌ Could not join the lobby.`);
    },
};
