/**
 * UUID Command — Generate a random UUID
 * Usage: .uuid [count]
 */
function generateUUID() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
        const r = Math.random()*16|0, v = c==='x' ? r : (r&0x3|0x8);
        return v.toString(16);
    });
}
module.exports = {
    name: 'uuid',
    aliases: ['uid', 'generateid'],
    description: 'Generate random UUIDs',
    category: 'utility',
    async execute({ reply, args }) {
        const count = Math.min(parseInt(args[0]) || 1, 10);
        const ids = Array.from({length: count}, generateUUID);
        reply(`🆔 *UUID Generator*\n\n\`\`\`\n${ids.join('\n')}\n\`\`\``);
    }
};
