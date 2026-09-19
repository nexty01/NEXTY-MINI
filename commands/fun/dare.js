const dares = [
    "Send a voice message singing your favorite song!",
    "Change your WhatsApp name to 'I lost a dare' for 1 hour.",
    "Send a funny selfie to this group.",
    "Tag someone and tell them one thing you like about them.",
    "Do 10 push-ups and report back.",
    "Send your most embarrassing photo in your gallery.",
    "Write a love poem for this group chat.",
    "Change your WhatsApp status to 'I'm doing a dare!' for 30 minutes.",
    "Send a voice message speaking in a funny accent.",
    "Text your mom 'I love you to the moon and back' right now."
];

module.exports = {
    name: 'dare',
    aliases: ['challenge'],
    description: 'Get a random dare',
    category: 'fun',
    async execute({ reply }) {
        const dare = dares[Math.floor(Math.random() * dares.length)];
        reply(`😈 *DARE!*\n\n${dare}`);
    }
};
