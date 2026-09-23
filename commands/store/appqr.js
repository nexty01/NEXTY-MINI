'use strict';
const { runAction } = require('../../utils/nextyStore');
module.exports = {
    name: 'appqr',
    aliases: ['appqrcode', 'playqr'],
    description: 'Create a QR code for a Google Play app',
    category: 'store',
    async execute(context) { return runAction('qr', context); },
};
