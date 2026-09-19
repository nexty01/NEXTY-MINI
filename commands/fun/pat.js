const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'pat', emoji: '✋', verb: 'patted', selfVerb: 'wants headpats',
    aliases: ['headpat'],
    fallbacks: [
        'https://media.tenor.com/0r3HOgZ3rGoAAAAC/anime-pat.gif',
        'https://media.tenor.com/E2zaIRGsxhMAAAAC/anime-pat.gif'
    ],
    description: 'Pat someone on the head'
});
