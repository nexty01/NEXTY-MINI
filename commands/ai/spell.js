/**
 * Spell Command — Check common spelling of a word
 * Usage: .spell <word>
 */
const commonMistakes = {
    'recieve':'receive','occured':'occurred','seperate':'separate','definately':'definitely',
    'existance':'existence','independant':'independent','persue':'pursue','calender':'calendar',
    'beleive':'believe','freind':'friend','accomodate':'accommodate','aquire':'acquire',
    'arguement':'argument','concious':'conscious','enviroment':'environment','goverment':'government',
    'maintainance':'maintenance','neccessary':'necessary','occurence':'occurrence','priviledge':'privilege',
    'publically':'publicly','reccommend':'recommend','restarant':'restaurant','suprise':'surprise',
    'tommorrow':'tomorrow','untill':'until','wierd':'weird','writting':'writing',
};
module.exports = {
    name: 'spell',
    aliases: ['spellcheck', 'spelling'],
    description: 'Check the spelling of a word',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) return reply('✏️ *Spell Check*\n\nUsage: .spell <word>\nExample: .spell recieve');
        const word = args[0].toLowerCase().trim();
        const correction = commonMistakes[word];
        if (correction) {
            return reply(`✏️ *Spell Check*\n\n❌ Misspelled: *${word}*\n✅ Correct: *${correction}*`);
        }
        reply(`✏️ *Spell Check*\n\n✅ "*${word}*" appears to be spelled correctly!\n\n_Note: Only common misspellings are detected._`);
    }
};
