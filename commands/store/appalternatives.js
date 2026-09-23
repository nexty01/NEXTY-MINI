'use strict';
const { runAction } = require('../../utils/nextyStore');
module.exports = {
    name: 'appalternatives',
    aliases: ['appalternative', 'similarapps'],
    description: 'Find similar Google Play app alternatives',
    category: 'store',
    async execute(context) { return runAction('alternatives', context); },
};
