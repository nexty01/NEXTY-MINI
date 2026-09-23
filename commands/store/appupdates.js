'use strict';
const { runAction } = require('../../utils/nextyStore');
module.exports = {
    name: 'appupdates',
    aliases: ['appupdate', 'checkapp'],
    description: 'Check a Google Play app update listing',
    category: 'store',
    async execute(context) { return runAction('updates', context); },
};
