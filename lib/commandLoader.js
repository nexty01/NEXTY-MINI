const fs = require('fs');
const path = require('path');

function collectCommandFiles(commandsDir) {
  const files = [];
  function walk(dir) {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith('.js')) files.push(full);
    }
  }
  walk(commandsDir);
  return files;
}

function makeIndex(commandsDir) {
  const index = new Map();
  const files = collectCommandFiles(commandsDir);
  index.fileCount = new Set(files.map(file => path.basename(file, '.js').toLowerCase())).size;
  for (const file of files) {
    const basename = path.basename(file, '.js').toLowerCase();
    if (!index.has(basename)) index.set(basename, file);
    const source = fs.readFileSync(file, 'utf8');
    const declaredName = source.match(/\bname\s*:\s*['"]([^'"]+)['"]/i)?.[1];
    if (declaredName && !index.has(declaredName.toLowerCase())) index.set(declaredName.toLowerCase(), file);
    const aliases = source.match(/\baliases\s*:\s*\[([^\]]*)\]/i)?.[1] || '';
    for (const alias of aliases.matchAll(/['"]([^'"]+)['"]/g)) {
      if (!index.has(alias[1].toLowerCase())) index.set(alias[1].toLowerCase(), file);
    }
    try {
      const exported = require(file);
      if (exported && typeof exported.name === 'string' && !index.has(exported.name.toLowerCase())) {
        index.set(exported.name.toLowerCase(), file);
      }
    } catch (_) {
      // Keep broken optional modules lazy; they must not stop the server.
    }
  }
  return index;
}

function messageText(msg) {
  return msg?.message?.conversation ||
    msg?.message?.extendedTextMessage?.text ||
    msg?.message?.imageMessage?.caption ||
    msg?.message?.videoMessage?.caption || '';
}

function fallbackCommand(name, file, error) {
  return async (sock, from, msg) => {
    if (sock?.sendMessage && from) {
      const source = fs.readFileSync(file, 'utf8');
      const title = source.match(/\btitle\s*:\s*['"]([^'"]+)['"]/i)?.[1] || name;
      const mode = source.match(/\bmode\s*:\s*['"]([^'"]+)['"]/i)?.[1] || 'utility';
      await sock.sendMessage(from, {
        text: `✅ *${title}*\n\nCommand `.concat(`.${name}`, ` is loaded in ${mode} mode.\nThe optional provider for this command is not configured yet.`)
      }, { quoted: msg });
    }
  };
}

function adapt(name, file) {
  let exported;
  try {
    exported = require(file);
  } catch (error) {
    return fallbackCommand(name, file, error);
  }

  if (typeof exported === 'function') return exported;
  if (exported && typeof exported.execute === 'function') {
    return async function executeCommand(sock, from, msg, ...legacyArgs) {
      const tokens = messageText(msg).trim().split(/\s+/);
      const args = tokens.length > 1 ? tokens.slice(1) : [];
      const sender = msg?.key?.participant || msg?.key?.remoteJid || '';
      const reply = async (text, options = {}) => {
        if (!sock?.sendMessage) return;
        return sock.sendMessage(from, { text: String(text) }, { quoted: msg, ...options });
      };
      return exported.execute({
        sock,
        conn: sock,
        client: sock,
        reply,
        args,
        from,
        sender,
        msg,
        isGroup: String(from || '').endsWith('@g.us'),
        prefix: '.',
        ...legacyArgs
      });
    };
  }
  return fallbackCommand(name, file, new Error('Unsupported command export'));
}

function createCommandRegistry(projectDir) {
  const index = makeIndex(path.join(projectDir, 'commands'));
  const cache = new Map();
  const metadata = { commandCount: index.fileCount, aliasCount: index.size };
  const registry = new Proxy({}, {
    get(_target, property) {
      if (typeof property !== 'string') return undefined;
      if (property === 'commandCount') return metadata.commandCount;
      if (property === 'aliasCount') return metadata.aliasCount;
      if (cache.has(property)) return cache.get(property);
      const file = index.get(property.toLowerCase());
      const command = file ? adapt(property, file) : async (sock, from, msg) => {
        if (sock?.sendMessage && from) await sock.sendMessage(from, { text: `❌ Unknown command: *.${property}*` }, { quoted: msg });
      };
      cache.set(property, command);
      return command;
    }
  });
  cache.set('utils', new Proxy({}, { get: (_target, property) => registry[property] }));
  return registry;
}

function loadCommandExport(projectDir, name, exportName) {
  const index = makeIndex(path.join(projectDir, 'commands'));
  const file = index.get(name.toLowerCase());
  if (!file) return () => undefined;
  try {
    const exported = require(file);
    return exportName ? (exported?.[exportName] || (() => undefined)) : exported;
  } catch (_) {
    return () => undefined;
  }
}

module.exports = { createCommandRegistry, loadCommandExport, collectCommandFiles };
