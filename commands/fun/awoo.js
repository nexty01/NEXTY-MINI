const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'awoo', emoji: '🐺', verb: 'awoo\'d at', selfVerb: 'is howling awoooo',
    fallbacks: [
        'https://media.tenor.com/5HWnvc7vGSwAAAAC/awoo-anime.gif'
    ],
    description: 'Awoo!'
});
