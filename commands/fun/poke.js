const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'poke', emoji: '👉', verb: 'poked', selfVerb: 'is poking the air',
    fallbacks: [
        'https://media.tenor.com/p_VLTHe5DCQAAAAC/anime-poke.gif',
        'https://media.tenor.com/H_8evidqyl4AAAAC/anime-poke.gif'
    ],
    description: 'Poke someone'
});
