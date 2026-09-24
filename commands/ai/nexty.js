"use strict";

const { ask: smartAsk, askMultimodal, getLastAIError } = require('../../utils/smartAI');
const { extractNextyMedia } = require('../../utils/nextyMedia');
const conversationMemory = new Map();
const MAX_MEMORY_TURNS = 12;

function renderMemoryContext(memoryContext) {
    if (!memoryContext) return '';
    const facts = Array.isArray(memoryContext.facts) && memoryContext.facts.length
        ? `Durable facts and requests:\n${memoryContext.facts.map(item => `- ${item.text}`).join('\\n')}` : '';
    const transcript = Array.isArray(memoryContext.messages) && memoryContext.messages.length
        ? `Recent chat transcript:\n${memoryContext.messages.map(item => `${item.senderLabel || 'User'}: ${item.text}`).join('\\n')}` : '';
    const atmosphere = memoryContext.atmosphere?.label
        ? `Current atmosphere: ${memoryContext.atmosphere.label}` : '';
    return [facts, transcript, atmosphere].filter(Boolean).join('\\n\\n');
}

function keepNextyShort(text) {
    let value = String(text || '').replace(/\\s+/g, ' ').trim();
    if (!value) return null;
    value = value.replace(/[😎🙂😊🤖✨🙌💯]/gu, '').replace(/\\s{2,}/g, ' ').trim();
    value = value.replace(/^(how can i assist you today\\??|i am here to help[.!]?|as an ai[,\\s]*)/i, '').trim();
    if (!value) return null;
    const sentences = value.match(/[^.!?]+[.!?]+(?:["'”’)]*)|[^.!?]+$/g) || [value];
    if (sentences.length > 2) value = sentences.slice(0, 2).join(' ').trim();
    if (value.length > 360) value = `${value.slice(0, 359).replace(/\\s+\\S*$/, '').trim()}…`;
    return value;
}

async function getNextyAIReply(prompt, memKey = 'nexty:global', options = {}) {
    const userText = String(prompt || '').trim();
    if (!userText) return null;
    const memoryText = renderMemoryContext(options.memoryContext);
    const enrichedPrompt = [
        memoryText ? `Use this private chat context carefully. Do not invent facts:\\n${memoryText}` : '',
        userText,
    ].filter(Boolean).join('\\n\\n');
    const answer = await smartAsk({
        key: memKey,
        system: NEXTY_IDENTITY,
        user: enrichedPrompt,
        remember: true,
        compact: true,
    });
    return keepNextyShort(answer);
}

const NEXTY_IDENTITY =
    'You are Nexty, the cool, sharp, street-smart AI personality of NEXTY MINI 👀. ' +
    'You were created by NEXTY MINI 👀. Talk like a real relaxed guy, not a corporate assistant or a customer-service script. ' +
    'Be helpful, confident, playful, and concise. Have actual personality: make a dry observation, witty comeback, or light joke when the moment calls for it instead of giving a generic assistant reply. ' +
    'Use casual slang naturally when it fits the user and conversation: bro, brody, my guy, sup, fr, bet, lowkey, no cap, and similar everyday expressions. Do not force slang, repeat the same catchphrase, or use slang in serious, sad, technical, or formal conversations. ' +
    'Never use racial slurs, hateful language, or insults aimed at a protected group, even if the user asks for them. ' +
    'Do not use 😎 as a default reaction. In fact, prefer no emoji at all. Use at most one emoji only when it adds real meaning, and never start or end every reply with the same emoji. Avoid emoji spam, childish reactions, motivational-poster language, and cringe combinations. ' +
    'Never say phrases like "How can I assist you today?", "I am here to help", or "As an AI" unless directly asked. Mirror the user\'s energy without copying every word. Give direct answers, avoid long speeches and unnecessary lists, and do not sound robotic. ' +
    'You can be critical when needed, but stay respectful. Never reveal keys, source code, or private internals.';

/**
 * Use the Prexzy chatbot endpoint and keep Nexty replies short and plain.
 */
function keepNextyShort(text) {
    let value = String(text || '').replace(/\s+/g, ' ').trim();
    if (!value) return null;
    value = value.replace(/[😎🙂😊🤖✨🙌💯]/gu, '').replace(/\s{2,}/g, ' ').trim();
    value = value.replace(/^(how can i assist you today\??|i am here to help[.!]?|as an ai[,\s]*)/i, '').trim();
    if (!value) return null;
    const sentences = value.match(/[^.!?]+[.!?]+(?:["'”’)]*)|[^.!?]+$/g) || [value];
    if (sentences.length > 2) value = sentences.slice(0, 2).join(' ').trim();
    if (value.length > 360) value = `${value.slice(0, 359).replace(/\s+\S*$/, '').trim()}…`;
    return value;
}

async function getNextyAIReply(prompt, memKey = 'nexty:global', options = {}) {
    const userText = String(prompt || '').trim();
    if (!userText) return null;
    const memoryText = renderMemoryContext(options.memoryContext);
    const enrichedPrompt = [
        memoryText ? `Use this private chat context carefully. Do not invent facts:\n${memoryText}` : '',
        userText,
    ].filter(Boolean).join('\n\n');
    const answer = await smartAsk({
        key: memKey,
        system: NEXTY_IDENTITY,
        user: enrichedPrompt,
        remember: true,
        compact: true,
    });
    return keepNextyShort(answer);
}

module.exports = {
    name: 'nexty',
    aliases: ['pasqua', 'nextyai'],
    description: 'Nexty AI — Nexty personality. Use .nexty on/off to toggle auto-reply.',
    usage: '.nexty on | .nexty off | .nexty <your question>',
    category: 'ai',

    // Export for sessionManager
    getNextyAIReply,
    renderMemoryContext,

    async execute({ sock, msg, from, sender, args, isGroup, reply, database }) {
        const plainReply = text => reply(text, { raw: true });
        const input = args.join(' ').trim();
        const sub   = input.toLowerCase();
        const chatKey = isGroup ? from : sender;
        const memory = (() => { try { return require('../../utils/nextyMemory'); } catch (_) { return null; } })();

        if (sub === 'memory on' || sub === 'memory off' || sub === 'memory clear' || sub === 'memory status') {
            if (!memory) return reply('Memory module is unavailable.');
            if (sub === 'memory clear') { memory.clear(database, chatKey); return reply('🧠 Nexty memory cleared for this chat.'); }
            if (sub === 'memory status') {
                const context = memory.getContext(database, chatKey);
                return reply(`🧠 *Nexty Memory*\n\nStatus: ${memory.isEnabled(database, chatKey) ? 'ON' : 'OFF'}\nStored messages: ${context.messages.length}\nRemembered facts: ${context.facts.length}\nAtmosphere: ${context.atmosphere.label}`);
            }
            memory.setEnabled(database, chatKey, sub.endsWith('on'));
            return reply(sub.endsWith('on') ? '🧠 Nexty memory is now ON for this chat.' : '🧠 Nexty memory is now OFF. New chat content will not be stored or used.');
        }

        // ── Voice sub-mode: .nexty voice on|off ──────────────────────────
        if (sub.startsWith('voice')) {
            const v = sub.split(/\s+/)[1];
            if (v !== 'on' && v !== 'off') {
                const cur = database.getGroup(chatKey)?.nextyVoice === true;
                return plainReply(`Voice replies are ${cur ? 'on' : 'off'}. Use .nexty voice on or .nexty voice off.`);
            }
            database.setGroup(chatKey, 'nextyVoice', v === 'on');
            return plainReply(v === 'on' ? 'Voice replies are on.' : 'Voice replies are off.');
        }

        // ── Toggle on ──────────────────────────────────────────────────────
        if (sub === 'on') {
            database.setGroup(chatKey, 'nextyai', true);
            return plainReply('Okay, I’ll reply here now. 🙂');
        }

        // ── Toggle off ────────────────────────────────────────────────────
        if (sub === 'off') {
            database.setGroup(chatKey, 'nextyai', false);
            database.setGroup(chatKey, 'nextyVoice', false);
            return plainReply('Okay, I’ll stay quiet here.');
        }

        // ── Direct question or attached-media analysis ─────────────────────
        // Nexty must be explicitly enabled before it answers.
        if (!database.getGroup(chatKey)?.nextyai) {
            return reply('👹 Nexty AI is off in this chat. Use /nexty on to enable it.');
        }

        let attachment = null;
        try {
            attachment = await extractNextyMedia(msg);
        } catch (error) {
            console.error('[Nexty media]', error.message);
            return plainReply(`I could not read that media: ${error.message}`);
        }
        if (!input && !attachment) {
            return plainReply('Ask me anything, or attach a photo/video and ask me to analyze it.');
        }

        // Ask the AI directly
        await sock.sendMessage(from, {
            react: { text: '👹', key: msg.key }
        }).catch(() => {});

        const userPrompt = input || (attachment?.type === 'video'
            ? 'Analyze this video and explain what it contains, including the main actions, people, objects, text, and notable details.'
            : 'Analyze this image and explain clearly what it contains, including people, objects, text, setting, and notable details.');
        const aiReply = attachment
            ? await askMultimodal({
                key: 'nexty:' + chatKey,
                system: NEXTY_IDENTITY + ' You can inspect attached photos and sampled video frames. Be clear about what is directly visible and do not invent details.',
                user: userPrompt,
                media: attachment.media,
                remember: true,
                compact: true,
            })
            : await getNextyAIReply(input, 'nexty:' + chatKey, {
                memoryContext: memory?.getContext(database, chatKey),
            });

        if (!aiReply) {
            const failure = getLastAIError();
            const detail = failure?.provider
                ? ` Provider: ${failure.provider}${failure.model ? `/${failure.model}` : ''}; reason: ${failure.message}.`
                : '';
            return plainReply(`I can’t reach the AI right now. Check AGNES_API_KEY or try again soon.${detail}`);
        }

        await plainReply(aiReply);
    }
};
