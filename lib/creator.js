'use strict';
/*! NEXTY MINI 👀 — creator module. */

const NAME = 'NEXTY MINI 👀';
const TELEGRAM = '';
const GITHUB = '';
const CHANNEL = 'https://whatsapp.com/channel/0029Vb9LtXLI7BeLmc4Xzv01';
const TAGLINE = 'Built by ' + NAME;

module.exports = {
    name: NAME,
    nameTitle: NAME,
    telegram: TELEGRAM,
    github: GITHUB,
    channel: CHANNEL,
    tagline: TAGLINE,
    stamp: (t) => t,
    isTampered: () => false,
};
