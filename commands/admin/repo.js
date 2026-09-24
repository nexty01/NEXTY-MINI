'use strict';

const fs = require('fs');
const path = require('path');
const https = require('https');

const REPO_OWNER = '';
const REPO_NAME = '';
const REPO_URL = '';
const LIVE_URL = 'https://nextyxmini-production.up.railway.app';
const CREATOR = 'NEXTY MINI 👀';
const IMAGE_PATH = path.join(__dirname, '../../assets/repo/nexty-repo.png');

function githubRepoStats() {
    return new Promise((resolve, reject) => {
        if (!REPO_OWNER || !REPO_NAME) return reject(new Error('no repo configured'));
        const request = https.get(`https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`, {
            headers: {
                'User-Agent': 'NEXTY-MINI-Repo-Command',
                Accept: 'application/vnd.github+json',
            },
        }, response => {
            const chunks = [];
            response.on('data', chunk => chunks.push(chunk));
            response.on('end', () => {
                if (response.statusCode < 200 || response.statusCode >= 300) {
                    reject(new Error(`GitHub API HTTP ${response.statusCode}`));
                    return;
                }
                try {
                    const data = JSON.parse(Buffer.concat(chunks).toString('utf8'));
                    resolve({
                        stars: Number(data.stargazers_count) || 0,
                        forks: Number(data.forks_count) || 0,
                        watchers: Number(data.subscribers_count ?? data.watchers_count) || 0,
                        description: String(data.description || 'WhatsApp multi-device bot').trim(),
                        size: Number(data.size) || 0,
                        updatedAt: data.updated_at || null,
                    });
                } catch (error) {
                    reject(error);
                }
            });
            response.on('error', reject);
        });
        request.setTimeout(12000, () => request.destroy(new Error('GitHub API timeout')));
        request.on('error', reject);
    });
}

function number(value) {
    return Number(value || 0).toLocaleString('en-US');
}

function formatSize(kb) {
    if (!kb) return '—';
    if (kb >= 1024) return `${(kb / 1024).toFixed(1)} MB`;
    return `${number(kb)} KB`;
}

function formatUpdated(value) {
    if (!value) return '—';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '—';
    return date.toLocaleString('en-GB', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
    });
}

const PROMO = '⚡ 𝗡𝗘𝗫𝗧𝗬 𝗠𝗜𝗡𝗜 👀 ⚡\n𝗢𝗳𝗳𝗶𝗰𝗶𝗮𝗹 𝗖𝗵𝗮𝗻𝗻𝗲𝗹\n𝗖𝗼𝗻𝗻𝗲𝗰𝘁 𝘆𝗼𝘂𝗿 𝗯𝗼𝘁 in seconds and unlock 𝟲𝟬𝟬+ 𝗰𝗼𝗺𝗺𝗮𝗻𝗱𝘀 — automation, media tools, AI, games & more, all in one bot.\n🔗 𝗖𝗼𝗻𝗻𝗲𝗰𝘁 𝗻𝗼𝘄:\nhttps://nextyxmini-production.up.railway.app/\n𝗦𝘁𝗮𝘆 𝗨𝗽𝗱𝗮𝘁𝗲𝗱 — new features, releases & maintenance alerts posted here first.\n𝗙𝗮𝘀𝘁 𝗦𝘂𝗽𝗽𝗼𝗿𝘁 — drop your questions, we reply quick.\n👀 𝗣𝗼𝘄𝗲𝗿𝗲𝗱 𝗯𝘆 𝗡𝗘𝗫𝗧𝗬 𝗠𝗜𝗡𝗜 👀';

function caption(stats, mention = 'NEXTY MINI 👀') {
    return [
        PROMO,
        '',
        '╭─⌈ `NEXTY MINI 👀` ⌋',
        '│',
        '│ ✧ *Name* : NEXTY MINI 👀',
        `│ ✧ *Owner* : ${CREATOR}`,
        `│ ✧ *Stars* : ${number(stats.stars)} ⭐`,
        `│ ✧ *Forks* : ${number(stats.forks)} 🍴`,
        `│ ✧ *Watchers* : ${number(stats.watchers)} 👁️`,
        `│ ✧ *Size* : ${formatSize(stats.size)}`,
        `│ ✧ *Updated* : ${formatUpdated(stats.updatedAt)}`,
        `│ ✧ *Live* : ${LIVE_URL}`,
        `│ *Description* : ${stats.description || 'WhatsApp multi-device bot.'}`,
        `│ Hey @${mention}! 👋`,
        '│ _*Don\'t forget*_ 🎉',
        '│ *to fork and star the repo!* ⭐',
        '╰───',
    ].join('\n');
}

async function sendRepo({ sock, msg, from, sender, phoneNumber, reply }) {
    let stats = { stars: 0, forks: 0, watchers: 0, size: 0, updatedAt: null, description: 'WhatsApp multi-device bot.' };
    try {
        stats = await githubRepoStats();
    } catch (error) {
        console.error('[repo] GitHub stats unavailable:', error.message);
    }

    const mentionJid = sender || from;
    const mentionNumber = String(phoneNumber || mentionJid || 'user').replace(/[^0-9]/g, '') || 'user';
    const text = caption(stats, mentionNumber);
    try {
        const image = fs.readFileSync(IMAGE_PATH);
        return await sock.sendMessage(from, {
            image,
            caption: text,
            mentions: mentionJid ? [mentionJid] : [],
        }, { quoted: msg });
    } catch (error) {
        console.error('[repo] image response failed:', error.message);
        return reply(text);
    }
}

module.exports = {
    name: 'repo',
    aliases: ['repository', 'source', 'github'],
    description: 'Show the official NEXTY MINI 👀 GitHub repository, live stats, and deployment link',
    category: 'admin',
    execute: sendRepo,
    __test: { caption, githubRepoStats, REPO_URL, LIVE_URL, CREATOR, IMAGE_PATH, formatSize, formatUpdated },
};
