'use strict';
const { runAction } = require('../../utils/nextyStore');
module.exports = {
    name: 'appreviews',
    aliases: ['appreview', 'reviewapp'],
    description: 'Show recent Google Play app reviews',
    category: 'store',
    async execute(context) { return runAction('reviews', context); },
};
