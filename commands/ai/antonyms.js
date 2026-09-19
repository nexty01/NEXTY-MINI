/**
 * Antonyms Command — Get antonyms for a word
 * Usage: .antonyms <word>
 */
const antonymMap = {
    happy:['sad','miserable','unhappy','sorrowful','gloomy'],
    sad:['happy','joyful','cheerful','elated','content'],
    big:['small','little','tiny','miniature','compact'],
    small:['big','large','huge','enormous','massive'],
    fast:['slow','sluggish','gradual','leisurely','unhurried'],
    slow:['fast','quick','rapid','swift','brisk'],
    smart:['stupid','foolish','ignorant','dumb','unintelligent'],
    good:['bad','evil','terrible','awful','dreadful'],
    bad:['good','great','excellent','wonderful','superb'],
    beautiful:['ugly','unattractive','hideous','plain','grotesque'],
    hot:['cold','cool','frigid','icy','freezing'],
    cold:['hot','warm','scorching','boiling','heated'],
    light:['dark','heavy','dim','gloomy','somber'],
    dark:['light','bright','luminous','radiant','sunny'],
    love:['hate','despise','loathe','detest','abhor'],
};
module.exports = {
    name: 'antonyms',
    aliases: ['antonym', 'opposite'],
    description: 'Get antonyms (opposites) for a word',
    category: 'ai',
    async execute({ reply, args }) {
        if (!args.length) return reply('📖 *Antonyms*\n\nUsage: .antonyms <word>\nExample: .antonyms happy');
        const word = args[0].toLowerCase();
        const ants = antonymMap[word];
        if (!ants) return reply(`📖 No antonyms found for "*${word}*".\n\nTry: happy, sad, big, small, fast, good, bad, hot, cold, love...`);
        reply(`📖 *Antonyms for "${word}"*\n\n${ants.map((a,i)=>`${i+1}. ${a}`).join('\n')}`);
    }
};
