const facts = [
    "Honey never spoils. Archaeologists have found 3000-year-old honey in Egyptian tombs that was still edible.",
    "A day on Venus is longer than a year on Venus.",
    "Octopuses have three hearts and blue blood.",
    "Bananas are berries, but strawberries are not.",
    "The shortest war in history was between Britain and Zanzibar in 1896. It lasted 38 minutes.",
    "A group of flamingos is called a 'flamboyance'.",
    "There are more possible iterations of a game of chess than there are atoms in the observable universe.",
    "Hot water can freeze faster than cold water in some conditions. This is called the Mpemba effect.",
    "Sharks are older than trees. They've existed for over 400 million years.",
    "The human brain generates about 20 watts of electrical power — enough to power a dim light bulb."
];

module.exports = {
    name: 'fact',
    aliases: ['facts', 'funfact'],
    description: 'Get a random fun fact',
    category: 'fun',
    async execute({ reply }) {
        const fact = facts[Math.floor(Math.random() * facts.length)];
        reply(`🧠 *Fun Fact!*\n\n${fact}`);
    }
};
