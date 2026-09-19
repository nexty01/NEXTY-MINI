/**
 * Dedupe Command — Remove duplicate lines (or words) from text.
 * Usage: .dedupe <text with repeated lines/words>
 */
module.exports = {
    name: 'dedupe',
    aliases: ['unique'],
    description: 'Remove duplicate lines or words from text',
    category: 'utility',
    async execute({ reply, args }) {
        const text = (args.join(' ') || '').trim();
        if (!text) {
            return reply(
                '🧹 *Dedupe*\n\n' +
                'Removes duplicates from your text.\n' +
                'Usage: .dedupe <text>\n' +
                'Multi-line input dedupes by line, single line dedupes by word.'
            );
        }

        const hasLines = text.includes('\n');
        const parts = hasLines ? text.split('\n') : text.split(/\s+/);
        const seen = new Set();
        const out = [];
        for (const raw of parts) {
            const key = raw.trim().toLowerCase();
            if (!key) continue;
            if (seen.has(key)) continue;
            seen.add(key);
            out.push(raw.trim());
        }

        const removed = parts.filter(p => p.trim()).length - out.length;
        reply(
            `🧹 *Dedupe* (${hasLines ? 'by line' : 'by word'})\n\n` +
            `${out.join(hasLines ? '\n' : ' ')}\n\n` +
            `_Removed ${removed} duplicate${removed === 1 ? '' : 's'}._`
        );
    }
};
