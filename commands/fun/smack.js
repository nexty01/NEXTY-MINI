const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'smack', emoji: '✋', verb: 'smacked', selfVerb: 'smacked the air',
    reaction: 'smack',
    fallbacks: [
        'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif',
        'https://media.giphy.com/media/xT0BKiwiVJq5B0XhHG/giphy.gif'
    ],
    description: 'Smack someone with an anime GIF'
});
