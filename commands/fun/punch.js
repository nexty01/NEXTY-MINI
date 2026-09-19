const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'punch', emoji: '👊', verb: 'punched', selfVerb: 'threw a punch',
    reaction: 'punch',
    fallbacks: [
        'https://media.giphy.com/media/xT0BKiwiVJq5B0XhHG/giphy.gif',
        'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif'
    ],
    description: 'Punch someone with an anime GIF'
});
