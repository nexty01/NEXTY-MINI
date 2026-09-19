/**
 * Synonyms Command — Get synonyms for a word
 * Usage: .synonyms <word>
 */
const synonymMap = {
    happy:['joyful','cheerful','content','pleased','elated','delighted','blissful'],
    sad:['unhappy','sorrowful','gloomy','melancholy','dejected','downcast','miserable'],
    big:['large','huge','enormous','massive','grand','colossal','gigantic'],
    small:['tiny','little','mini','petite','minute','compact','microscopic'],
    fast:['quick','rapid','swift','speedy','hasty','brisk','fleet'],
    slow:['sluggish','gradual','leisurely','unhurried','plodding','languid'],
    smart:['intelligent','clever','bright','brilliant','sharp','wise','astute'],
    good:['excellent','great','superb','wonderful','fine','splendid','marvelous'],
    bad:['terrible','awful','dreadful','poor','inferior','unpleasant','horrible'],
    beautiful:['gorgeous','stunning','lovely','attractive','exquisite','elegant','radiant'],
    funny:['humorous','amusing','comical','hilarious','witty','entertaining'],
    angry:['furious','irate','enraged','livid','infuriated','wrathful','incensed'],
};
module.exports = {
    name: 'synonyms',
    aliases: ['synonym', 'similar'],
    description: 'Get synonyms for a word',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) return reply('📚 *Synonyms*\n\nUsage: .synonyms <word>\nExample: .synonyms happy');
        const word = args[0].toLowerCase();
        const syns = synonymMap[word];
        if (!syns) return reply(`📚 No synonyms found for "*${word}*".\n\nTry common words like: happy, sad, big, small, fast, smart, good, bad...`);
        reply(`📚 *Synonyms for "${word}"*\n\n${syns.map((s,i)=>`${i+1}. ${s}`).join('\n')}`);
    }
};
