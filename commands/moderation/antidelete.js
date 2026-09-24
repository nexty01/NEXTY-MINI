/**
 * Anti-Delete — recovers deleted messages (text, images, videos, audio, docs, stickers)
 *   .antidelete on|off        → owner: EVERY chat (personal + groups), alerts land in your inbox
 *   .antidelete group on|off  → this group only
 *   .antidelete status
 */
'use strict';
const { createRecoverCommand } = require('../../utils/recoverToggle');

module.exports = createRecoverCommand({
    name: 'antidelete', aliases: ['ad', 'antirevoke'],
    description: 'Recover deleted messages in personal chats and groups (alerts go to your inbox)',
    title: 'ANTI-DELETE', emoji: '🗑️', globalKey: 'antidelete', groupKey: 'antidelete',
    what: 'deleted messages',
});
