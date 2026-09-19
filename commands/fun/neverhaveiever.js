module.exports = {
    name: 'neverhaveiever',
    aliases: ['nhie'],
    description: 'Random never-have-I-ever.',
    category: 'fun',
    async execute({ reply }) {
        const lines = [
            'Never have I ever pretended to like a gift.',
            'Never have I ever fallen asleep in class.',
            'Never have I ever ghosted someone.',
            'Never have I ever cried watching a movie.',
            'Never have I ever stalked an ex online.',
        ];
        return reply('🍻 ' + lines[Math.floor(Math.random()*lines.length)]);
    }
};
