const jokes = [
    "Why don't scientists trust atoms? Because they make up everything! 😂",
    "I told my wife she was drawing her eyebrows too high. She looked surprised. 😂",
    "Why can't you give Elsa a balloon? Because she'll let it go! 😂",
    "I'm reading a book about anti-gravity. It's impossible to put down! 😂",
    "Did you hear about the mathematician who's afraid of negative numbers? He'll stop at nothing to avoid them! 😂",
    "Why do cows wear bells? Because their horns don't work! 😂",
    "What do you call a fake noodle? An impasta! 😂",
    "Why did the scarecrow win an award? Because he was outstanding in his field! 😂",
    "What do you call cheese that isn't yours? Nacho cheese! 😂",
    "Why can't a bicycle stand on its own? It's two-tired! 😂"
];

module.exports = {
    name: 'joke',
    aliases: ['jokes', 'funny'],
    description: 'Get a random joke',
    category: 'fun',
    async execute({ reply }) {
        const joke = jokes[Math.floor(Math.random() * jokes.length)];
        reply(`😂 *Joke Time!*\n\n${joke}`);
    }
};
