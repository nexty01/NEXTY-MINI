const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'slap', emoji: '👋', verb: 'slapped', selfVerb: 'slapped themselves',
    aliases: ['hit'],
    fallbacks: [
        'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
        'https://media.giphy.com/media/xT0BKiwiVJq5B0XhHG/giphy.gif'
    ],
    description: 'Slap someone with an anime GIF'
});
