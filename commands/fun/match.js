/**
 * .match — Live football matches via prexzyvilla Sports API
 * Usage: .match            -> list current/recent matches
 *        .match arsenal    -> filter by team / league / country
 */

const API = 'https://prexzyapis.com/sports/football?detail=&category=&id=&lang=';

function fmtTime(ts) {
    if (!ts) return 'TBD';
    try {
        const d = new Date(Number(ts));
        return d.toISOString().replace('T', ' ').slice(0, 16) + ' UTC';
    } catch { return 'TBD'; }
}

function statusOf(m) {
    // state: -1 finished, 0 not started, others = in-progress minute markers
    if (m.state === -1) return '✅ Finished';
    if (m.state === 0) return '⏳ Upcoming';
    return '🔴 LIVE';
}

function fmtMatch(m) {
    const score = (m.homeScore != null && m.awayScore != null)
        ? `${m.homeScore} - ${m.awayScore}`
        : 'vs';
    const ht = (m.homeHalfScore != null && m.awayHalfScore != null && m.state !== 0)
        ? ` (HT ${m.homeHalfScore}-${m.awayHalfScore})` : '';
    return [
        `🏆 *${m.leagueEn || 'Match'}*`,
        `⚽ ${m.homeName} ${score} ${m.awayName}${ht}`,
        `📊 ${statusOf(m)}`,
        `🕐 ${fmtTime(m.matchTime_t || m.startTime_t)}`,
        m.location ? `🏟️ ${m.location}` : null
    ].filter(Boolean).join('\n');
}

async function fetchJson(url, ms = 12000) {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), ms);
    try {
        const r = await fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'SukunaMD/3.0' } });
        return await r.json();
    } finally { clearTimeout(t); }
}

module.exports = {
    name: 'match',
    aliases: ['livematch', 'football', 'matches'],
    description: 'Get live football matches. Usage: .match [team or country]',
    category: 'fun',
    async execute({ sock, msg, from, reply, args }) {
        const query = args.join(' ').trim().toLowerCase();

        let payload;
        try {
            payload = await fetchJson(API);
        } catch (err) {
            return reply('⚠️ Could not reach the football API right now. Try again in a moment.');
        }

        if (!payload || payload.status === false) {
            return reply(`⚠️ Football API error: ${payload?.error || 'unknown error'}`);
        }

        const matches = Array.isArray(payload?.data?.matches) ? payload.data.matches : [];
        if (!matches.length) {
            return reply('⚽ No matches available right now.');
        }

        let filtered = matches;
        if (query) {
            filtered = matches.filter(m => {
                const hay = [
                    m.homeName, m.awayName, m.leagueEn,
                    m.countryEn, m.teamLink
                ].filter(Boolean).join(' ').toLowerCase();
                return hay.includes(query);
            });
            if (!filtered.length) {
                return reply(`🔍 No matches found for "*${query}*". Try another team or league name.`);
            }
        }

        const top = filtered.slice(0, 10);
        const header = query
            ? `⚽ *Matches matching "${query}"* (${filtered.length} found, showing ${top.length})`
            : `⚽ *Football — ${top.length} of ${matches.length} matches*`;
        const body = top.map(fmtMatch).join('\n\n');
        const text = `${header}\n\n${body}`;

        const logo = top[0]?.homeLogoUrl || top[0]?.leagueLogo;
        if (logo) {
            try {
                await sock.sendMessage(from, { image: { url: logo }, caption: text }, { quoted: msg });
                return;
            } catch { /* fall through */ }
        }
        return reply(text);
    }
};
