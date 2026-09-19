const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'kiss', emoji: '💋', verb: 'kissed', selfVerb: 'blew a kiss 💕',
    aliases: ['smooch', 'mwah'],
    fallbacks: [
        'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif',
        'https://media.giphy.com/media/zkppEMFvRX5FC/giphy.gif'
    ],
    description: 'Kiss someone with an anime GIF'
});
