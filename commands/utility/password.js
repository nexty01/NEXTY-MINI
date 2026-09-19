/**
 * Password Command — Generate secure passwords
 * Usage: .password <length>
 */

module.exports = {
    name: 'password',
    aliases: ['passgen', 'genpass'],
    description: 'Generate a secure random password',
    category: 'utility',
    async execute({ reply, args }) {
        const length = parseInt(args[0]) || 12;
        
        if (length < 4 || length > 64) {
            return reply('❌ Password length must be between 4 and 64 characters.');
        }

        const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lowercase = 'abcdefghijklmnopqrstuvwxyz';
        const numbers = '0123456789';
        const symbols = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const allChars = uppercase + lowercase + numbers + symbols;

        let password = '';
        // Ensure at least one of each type
        password += uppercase[Math.floor(Math.random() * uppercase.length)];
        password += lowercase[Math.floor(Math.random() * lowercase.length)];
        password += numbers[Math.floor(Math.random() * numbers.length)];
        password += symbols[Math.floor(Math.random() * symbols.length)];

        // Fill the rest
        for (let i = 4; i < length; i++) {
            password += allChars[Math.floor(Math.random() * allChars.length)];
        }

        // Shuffle the password
        password = password.split('').sort(() => Math.random() - 0.5).join('');

        reply(
            `🔐 *Password Generated*\n\n` +
            `Length: ${length} characters\n` +
            `Password: \`${password}\`\n\n` +
            `⚠️ Save this password securely!`
        );
    }
};
