/**
 * Command Loader - Loads all WhatsApp commands
 */

const fs = require('fs');
const path = require('path');

class CommandLoader {
    constructor() {
        this.commands = new Map();
        this.aliases = new Map();
    }

    loadCommands() {
        const commandsDir = path.join(__dirname, '..', 'commands');
        const categories = fs.readdirSync(commandsDir).filter(f =>
            fs.statSync(path.join(commandsDir, f)).isDirectory()
        );

        for (const category of categories) {
            this.loadFromDir(path.join(commandsDir, category), category);
        }

        console.log(`[LOADER] Loaded ${this.commands.size} commands across ${categories.length} categories`);
        return this.commands;
    }

    loadFromDir(dir, category) {
        if (!fs.existsSync(dir)) return;

        const files = fs.readdirSync(dir).filter(f => f.endsWith('.js'));

        for (const file of files) {
            try {
                const filePath = path.join(dir, file);
                delete require.cache[require.resolve(filePath)];
                const command = require(filePath);

                if (command.name) {
                    command.category = category;
                    this.commands.set(command.name, command);

                    if (command.aliases && Array.isArray(command.aliases)) {
                        for (const alias of command.aliases) {
                            this.aliases.set(alias, command.name);
                        }
                    }
                }
            } catch (error) {
                console.error(`[LOADER] Error loading ${file}:`, error.message);
            }
        }
    }

    getCommand(name) {
        if (this.commands.has(name)) return this.commands.get(name);
        if (this.aliases.has(name)) return this.commands.get(this.aliases.get(name));
        return null;
    }

    getAllCommands() {
        return this.commands;
    }

    // Array form — used by sessionManager.js's listener loop
    // (`for (const cmd of commandLoader.getAll())`), which needs
    // command objects directly rather than a Map's [key, value] pairs.
    getAll() {
        return Array.from(this.commands.values());
    }

    getCommandsByCategory(category) {
        const result = [];
        for (const [name, cmd] of this.commands) {
            if (cmd.category === category) result.push({ name, ...cmd });
        }
        return result;
    }
}

module.exports = new CommandLoader();
