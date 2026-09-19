const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'blush', emoji: '☺️', verb: 'blushed at', selfVerb: 'is blushing',
    fallbacks: [
        'https://media.tenor.com/QXMlGn3jOOcAAAAC/anime-blush.gif',
        'https://media.tenor.com/0xK0bF5IZkkAAAAC/anime-shy.gif'
    ],
    description: 'Blush, optionally at someone'
});
