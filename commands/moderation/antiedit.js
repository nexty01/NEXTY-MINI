/**
 * Anti-Edit — shows the original and the edited text of edited messages
 *   .antiedit on|off        → owner: EVERY chat (personal + groups), alerts land in your inbox
 *   .antiedit group on|off  → this group only
 *   .antiedit status
 */
'use strict';
const { createRecoverCommand } = require('../../utils/recoverToggle');

module.exports = createRecoverCommand({
    name: 'antiedit', aliases: ['ae'],
    description: 'Reveal the original text when someone edits a message (personal chats + groups)',
    title: 'ANTI-EDIT', emoji: '✏️', globalKey: 'antiedit', groupKey: 'antiedit',
    what: 'edited messages (original + new text)',
});
