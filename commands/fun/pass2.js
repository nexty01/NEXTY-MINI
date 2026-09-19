module.exports = {
    name: 'pass2',
    aliases: ['genpass'],
    description: 'Generate a strong password. Usage: .pass2 [length=16]',
    category: 'fun',
    async execute({ args, reply }) {
        const n = Math.min(Math.max(parseInt(args[0]) || 16, 4), 128);
        const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let out = ''; for (let i = 0; i < n; i++) out += charset[Math.floor(Math.random()*charset.length)];
        return reply('🔐 *Password (' + n + ')*\n`' + out + '`');
    }
};
