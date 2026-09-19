const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'cry', emoji: '😭', verb: 'cried over', selfVerb: 'is crying',
    aliases: ['sob'],
    fallbacks: [
        'https://media.tenor.com/9SkU1IzkLG0AAAAC/anime-cry.gif',
        'https://media.tenor.com/IZmh-3VLCY8AAAAC/anime-sad.gif'
    ],
    description: 'Cry, optionally at someone'
});
