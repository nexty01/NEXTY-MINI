const { makeAnimeReaction } = require('../../lib/animeReaction');
module.exports = makeAnimeReaction({
    name: 'hug', emoji: '🤗', verb: 'hugged', selfVerb: 'needs a hug',
    aliases: ['cuddle'],
    fallbacks: [
        'https://media.tenor.com/kCZjTqCKiggAAAAC/hug-anime.gif',
        'https://media.tenor.com/MA1Q7HRsZZAAAAAC/anime-hug.gif'
    ],
    description: 'Hug someone with an anime GIF'
});
