/**
 * Notes Command — Save and view group notes
 * Usage: .notes | .notes add <note> | .notes clear
 */
const database = require('../../utils/database');
module.exports = {
    name: 'notes',
    aliases: ['note', 'groupnotes'],
    description: 'Save and retrieve group notes',
    category: 'group',
    async execute({ reply, args, from, isGroup }) {
        if (!isGroup) return reply('👥 This command can only be used in groups!');
        const sub = args[0]?.toLowerCase();
        if (sub === 'add' || sub === 'save') {
            const text = args.slice(1).join(' ');
            if (!text) return reply('❌ Usage: .notes add <your note>');
            const existing = database.getGroupData(from, 'notes') || [];
            existing.push({ text, time: Date.now() });
            database.setGroupData(from, 'notes', existing);
            return reply(`📝 *Note Saved!*\n\n"${text}"`);
        }
        if (sub === 'clear') {
            database.setGroupData(from, 'notes', []);
            return reply('🗑️ All group notes have been cleared.');
        }
        const notes = database.getGroupData(from, 'notes') || [];
        if (!notes.length) return reply('📝 No notes saved for this group.\n\nAdd one with: .notes add <text>');
        const list = notes.map((n,i) => `${i+1}. ${n.text}`).join('\n');
        reply(`📝 *Group Notes* (${notes.length})\n\n${list}\n\nUse .notes clear to remove all.`);
    }
};
