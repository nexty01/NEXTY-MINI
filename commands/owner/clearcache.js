/**
 * ClearCache Command — Clear bot memory/cache
 * Usage: .clearcache
 */
module.exports = {
    name: 'clearcache',
    aliases: ['clearram', 'gc'],
    description: 'Clear bot cache and free memory (owner only)',
    category: 'owner',
    ownerOnly: true,
    async execute({ reply }) {
        const before = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        if (global.gc) global.gc();
        Object.keys(require.cache).forEach(key => {
            if (!key.includes('node_modules') && !key.includes('sessionManager') && !key.includes('database')) {
                delete require.cache[key];
            }
        });
        const after = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
        reply(`🧹 *Cache Cleared!*\n\n💾 Memory before: *${before} MB*\n💾 Memory after: *${after} MB*\n\n✅ Bot cache cleared successfully.`);
    }
};
