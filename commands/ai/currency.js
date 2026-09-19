/**
 * Currency Command — Currency conversion with approximate rates
 * Usage: .currency <amount> <from> <to>
 */
// Approximate rates vs USD (updated periodically)
const rates = {
    USD:1, EUR:0.92, GBP:0.79, JPY:149.5, NGN:1480, KES:129, GHS:12.5,
    ZAR:18.6, INR:83.1, CAD:1.36, AUD:1.54, CHF:0.9, CNY:7.24, BRL:4.97,
    MXN:17.2, AED:3.67, SAR:3.75, PKR:278, BDT:110, PHP:56.5, THB:35.6,
    MYR:4.7, IDR:15600, EGP:30.9, MAD:10.1, TZS:2520, UGX:3800, ZMW:26.5
};
module.exports = {
    name: 'currency',
    aliases: ['convert', 'fx'],
    description: 'Convert between currencies (approximate rates)',
    category: 'ai',
    async execute({ reply, args }) {
        if (args.length < 3) return reply('💱 *Currency Converter*\n\nUsage: .currency <amount> <from> <to>\nExample: .currency 100 USD NGN\n\nCurrencies: ' + Object.keys(rates).join(', '));
        const amount = parseFloat(args[0]);
        const from = args[1].toUpperCase(), to = args[2].toUpperCase();
        if (isNaN(amount)) return reply('❌ Enter a valid amount.');
        if (!rates[from]) return reply(`❌ Unknown currency: ${from}`);
        if (!rates[to]) return reply(`❌ Unknown currency: ${to}`);
        const inUSD = amount / rates[from];
        const result = (inUSD * rates[to]).toFixed(2);
        reply(`💱 *Currency Conversion*\n\n${amount.toLocaleString()} ${from}\n= *${parseFloat(result).toLocaleString()} ${to}*\n\n_⚠️ Approximate rate — verify for financial decisions_`);
    }
};
