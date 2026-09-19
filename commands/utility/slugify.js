/**
 * Slugify Command — Convert text into a URL-friendly slug.
 * Usage: .slugify <text>
 */
module.exports = {
    name: 'slugify',
    aliases: ['slug'],
    description: 'Convert text into a URL-friendly slug',
    category: 'utility',
    async execute({ reply, args }) {
        const text = args.join(' ').trim();
        if (!text) {
            return reply('🔗 *Slugify*\n\nUsage: .slugify <text>\nExample: .slugify Hello World! My First Post');
        }
        const slug = text
            .toLowerCase()
            .normalize('NFKD')
            .replace(/[\u0300-\u036f]/g, '')   // strip accents
            .replace(/[^a-z0-9\s-]/g, '')      // remove invalid chars
            .trim()
            .replace(/[\s_]+/g, '-')           // spaces -> dashes
            .replace(/-+/g, '-')               // collapse dashes
            .replace(/^-+|-+$/g, '');          // trim dashes

        reply(`🔗 *Slugify*\n\nInput: ${text}\nSlug: \`${slug || '(empty)'}\``);
    }
};
