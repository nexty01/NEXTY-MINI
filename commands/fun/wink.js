const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'wink', emoji: '😉', verb: 'winked at', selfVerb: 'winked into the void',
    fallbacks: [
        'https://media.tenor.com/lwt2hsZK7yMAAAAC/anime-wink.gif',
        'https://media.tenor.com/HjqdH-cqfYUAAAAC/anime-wink.gif'
    ],
    description: 'Wink at someone'
});
