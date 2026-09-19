const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'milf', emoji: '💖', verb: 'sent milf energy to', selfVerb: 'is radiating milf energy',
    title: 'MILF', reaction: 'love',
    fallbacks: [
        'https://media.giphy.com/media/G3va31oEEnIkM/giphy.gif'
    ],
    description: 'Send a milf reaction GIF'
});
