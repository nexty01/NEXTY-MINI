/**
 * Anti-Status-Delete — when a contact deletes a status you saw, the recovered
 * status (text / image / video) is sent to your inbox.
 *   .antistatus on|off|status
 */
'use strict';
const { createRecoverCommand } = require('../../utils/recoverToggle');

const cmd = createRecoverCommand({
    name: 'antistatus', aliases: ['antistatusdelete', 'antistatusdel', 'antideletestatus'],
    description: 'Recover deleted statuses and send them to your inbox',
    title: 'ANTI-STATUS DELETE', emoji: '🗑️', globalKey: 'antistatusdelete', groupKey: null,
    what: 'deleted statuses',
});
cmd.category = 'owner';
cmd.ownerOnly = true;
module.exports = cmd;
