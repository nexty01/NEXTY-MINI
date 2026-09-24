'use strict';
/**
 * Permission metadata for commands whose own source does not enforce it.
 * Applied by the loaders (utils/commandLoader.js and index.js) and enforced by
 * lib/access.authorizeCommand() in every dispatch path (commands, sticker
 * triggers, natural-language routing, buttons). Values already declared by a
 * command file are never overridden.
 */
const GROUP_ADMIN = { adminOnly: true, groupOnly: true };

const POLICY = Object.freeze({
    // group-mutating admin / moderation commands that had no permission check
    add: GROUP_ADMIN, broadcast: GROUP_ADMIN, hidetag: GROUP_ADMIN, tagall: GROUP_ADMIN,
    clearwarn: GROUP_ADMIN, warn: GROUP_ADMIN, resetwarn: GROUP_ADMIN, resetlinkwarn: GROUP_ADMIN,
    antiforward: GROUP_ADMIN, antinsfw: GROUP_ADMIN, antiurl: GROUP_ADMIN, antihijack: GROUP_ADMIN,
    blacklist: GROUP_ADMIN, unblacklist: GROUP_ADMIN, setdesc: GROUP_ADMIN, setsubject: GROUP_ADMIN,
    setwelcomemsg: GROUP_ADMIN, setgoodbyemsg: GROUP_ADMIN,
    // bot-wide settings
    unban: { ownerOnly: true },
    setdesign: { sudoOnly: true },
});

function applyPolicy(command) {
    if (!command || !command.name) return command;
    const rule = POLICY[String(command.name).toLowerCase()];
    if (rule) for (const [key, value] of Object.entries(rule)) if (command[key] === undefined) command[key] = value;
    return command;
}

module.exports = { POLICY, applyPolicy };
