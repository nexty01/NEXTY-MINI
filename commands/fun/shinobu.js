const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'shinobu', emoji: '🌸', verb: 'sent Shinobu vibes to', selfVerb: 'is feeling Shinobu vibes',
    title: 'SHINOBU', reaction: 'dance',
    fallbacks: [
        'https://media.giphy.com/media/Zau0yrl17uzdK/giphy.gif'
    ],
    description: 'Send a Shinobu reaction GIF'
});
