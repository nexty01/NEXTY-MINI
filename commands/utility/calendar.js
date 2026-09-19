/**
 * Calendar Command — Cyber "blue canvas" calendar card
 * Usage:
 *   .calendar                 → calendar for the bot's home region (Lagos, Nigeria)
 *   .calendar <country/city>  → calendar for that country/region's local time + weather
 *
 * Same visual family as .alive / .uptime (cyan/purple cyber chrome via canvasRender.js).
 * Draws a real month grid with today highlighted, plus a side panel showing
 * local time, timezone, region/country, week/day-of-year, and live weather
 * (fetched the same way .weather does — wttr.in, no API key needed).
 */

'use strict';

const https = require('https');
const config = require('../../config');
const { renderCalendarCard } = require('../../utils/canvasRender');

// ── country/region → { timezone, city-for-weather } ─────────────────────────
// Keys are normalised (lowercase, spaces stripped) before lookup.
const REGIONS = {
    nigeria:        { tz: 'Africa/Lagos',        city: 'Lagos',        country: 'Nigeria' },
    lagos:          { tz: 'Africa/Lagos',        city: 'Lagos',        country: 'Nigeria' },
    ghana:          { tz: 'Africa/Accra',        city: 'Accra',        country: 'Ghana' },
    kenya:          { tz: 'Africa/Nairobi',      city: 'Nairobi',      country: 'Kenya' },
    southafrica:    { tz: 'Africa/Johannesburg', city: 'Johannesburg', country: 'South Africa' },
    egypt:          { tz: 'Africa/Cairo',        city: 'Cairo',        country: 'Egypt' },

    america:        { tz: 'America/New_York',    city: 'New York',     country: 'United States' },
    usa:            { tz: 'America/New_York',    city: 'New York',     country: 'United States' },
    unitedstates:   { tz: 'America/New_York',    city: 'New York',     country: 'United States' },
    newyork:        { tz: 'America/New_York',    city: 'New York',     country: 'United States' },
    losangeles:     { tz: 'America/Los_Angeles', city: 'Los Angeles',  country: 'United States' },
    chicago:        { tz: 'America/Chicago',     city: 'Chicago',      country: 'United States' },
    canada:         { tz: 'America/Toronto',     city: 'Toronto',      country: 'Canada' },
    toronto:        { tz: 'America/Toronto',     city: 'Toronto',      country: 'Canada' },
    brazil:         { tz: 'America/Sao_Paulo',    city: 'Sao Paulo',    country: 'Brazil' },
    mexico:         { tz: 'America/Mexico_City',  city: 'Mexico City',  country: 'Mexico' },

    uk:             { tz: 'Europe/London',       city: 'London',       country: 'United Kingdom' },
    unitedkingdom:  { tz: 'Europe/London',       city: 'London',       country: 'United Kingdom' },
    england:        { tz: 'Europe/London',       city: 'London',       country: 'United Kingdom' },
    london:         { tz: 'Europe/London',       city: 'London',       country: 'United Kingdom' },
    france:         { tz: 'Europe/Paris',        city: 'Paris',        country: 'France' },
    germany:        { tz: 'Europe/Berlin',       city: 'Berlin',       country: 'Germany' },
    italy:          { tz: 'Europe/Rome',         city: 'Rome',         country: 'Italy' },
    spain:          { tz: 'Europe/Madrid',       city: 'Madrid',       country: 'Spain' },
    russia:         { tz: 'Europe/Moscow',       city: 'Moscow',       country: 'Russia' },

    india:          { tz: 'Asia/Kolkata',        city: 'Mumbai',       country: 'India' },
    pakistan:       { tz: 'Asia/Karachi',        city: 'Karachi',      country: 'Pakistan' },
    china:          { tz: 'Asia/Shanghai',       city: 'Beijing',      country: 'China' },
    japan:          { tz: 'Asia/Tokyo',          city: 'Tokyo',        country: 'Japan' },
    tokyo:          { tz: 'Asia/Tokyo',          city: 'Tokyo',        country: 'Japan' },
    southkorea:     { tz: 'Asia/Seoul',          city: 'Seoul',        country: 'South Korea' },
    uae:            { tz: 'Asia/Dubai',          city: 'Dubai',        country: 'United Arab Emirates' },
    dubai:          { tz: 'Asia/Dubai',          city: 'Dubai',        country: 'United Arab Emirates' },
    saudiarabia:    { tz: 'Asia/Riyadh',         city: 'Riyadh',       country: 'Saudi Arabia' },
    indonesia:      { tz: 'Asia/Jakarta',        city: 'Jakarta',      country: 'Indonesia' },
    singapore:      { tz: 'Asia/Singapore',      city: 'Singapore',    country: 'Singapore' },
    philippines:    { tz: 'Asia/Manila',         city: 'Manila',       country: 'Philippines' },

    australia:      { tz: 'Australia/Sydney',   city: 'Sydney',       country: 'Australia' },
    newzealand:     { tz: 'Pacific/Auckland',    city: 'Auckland',     country: 'New Zealand' },
};

function lookupRegion(query) {
    const key = String(query || '').toLowerCase().replace(/[^a-z]/g, '');
    return REGIONS[key] || null;
}

function httpGet(url) {
    return new Promise((resolve, reject) => {
        https.get(url, { headers: { 'User-Agent': 'curl/8' }, timeout: 8000 }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(data));
        }).on('error', reject).on('timeout', () => reject(new Error('timeout')));
    });
}

// Fetch weather for a city via wttr.in — same source/format as .weather.
// Never throws; returns null on any failure so the calendar still renders.
async function fetchWeather(city) {
    try {
        const url = `https://wttr.in/${encodeURIComponent(city)}?format=j1`;
        const raw = await httpGet(url);
        const data = JSON.parse(raw);
        const cur = data?.current_condition?.[0];
        if (!cur) return null;
        return {
            tempC:       parseInt(cur.temp_C, 10) || 0,
            condition:   cur.weatherDesc?.[0]?.value || '',
            humidity:    parseInt(cur.humidity, 10) || 0,
            windKph:     parseInt(cur.windspeedKmph, 10) || 0,
            weatherCode: parseInt(cur.weatherCode, 10) || 0,
        };
    } catch (_) {
        return null;
    }
}

function tzAbbrevOffset(tz, now) {
    try {
        const parts = new Intl.DateTimeFormat('en-US', {
            timeZone: tz, timeZoneName: 'shortOffset',
        }).formatToParts(now);
        const off = parts.find(p => p.type === 'timeZoneName')?.value || '';
        return off;
    } catch (_) {
        return '';
    }
}

module.exports = {
    name: 'calendar',
    aliases: ['cal', 'kalender'],
    description: 'Show a live calendar card — date, time, region, weather (optionally by country)',
    category: 'utility',

    async execute({ sock, msg, from, reply, args }) {
        // ── resolve region ───────────────────────────────────────────────
        const query = args.join(' ').trim();
        let region;
        if (query) {
            region = lookupRegion(query);
            if (!region) {
                const sample = ['Nigeria', 'America', 'UK', 'India', 'Japan', 'Ghana', 'Canada', 'Dubai'];
                return reply(
                    `❌ Unknown country/region: "${query}"\n\n` +
                    `Try one of: ${sample.join(', ')}, etc.\n` +
                    `_Usage: .calendar [country]_`
                );
            }
        } else {
            // default → bot's home region (Nigeria), falls back gracefully
            region = REGIONS.nigeria;
        }

        const { tz, city, country } = region;
        const now = new Date();

        // ── date/time breakdown in the target timezone ─────────────────
        const weekday  = now.toLocaleString('en-US', { timeZone: tz, weekday: 'long' });
        const monthName = now.toLocaleString('en-US', { timeZone: tz, month: 'long' });
        const dayNum   = parseInt(now.toLocaleString('en-US', { timeZone: tz, day: 'numeric' }), 10);
        const yearNum  = parseInt(now.toLocaleString('en-US', { timeZone: tz, year: 'numeric' }), 10);
        const monthIdx = now.toLocaleString('en-US', { timeZone: tz, month: 'numeric' }) - 1;
        const timeStr  = now.toLocaleString('en-US', {
            timeZone: tz, hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true,
        });
        const fullDate = `${weekday}, ${dayNum} ${monthName} ${yearNum}`;
        const offset   = tzAbbrevOffset(tz, now);
        const tzLabel  = offset ? `${tz} (${offset})` : tz;

        // week number + day-of-year — same simple formula already used by
        // the .time command, kept consistent rather than introducing a
        // second slightly-different convention.
        const localApprox = new Date(yearNum, monthIdx, dayNum);
        const dayOfYear = Math.floor((localApprox - new Date(yearNum, 0, 0)) / 86400000);
        const weekNum = Math.ceil(dayOfYear / 7);
        const daysInYear = ((yearNum % 4 === 0 && yearNum % 100 !== 0) || yearNum % 400 === 0) ? 366 : 365;

        // ── weather (best-effort, never blocks the card) ────────────────
        const weather = await fetchWeather(city);

        // ── render ───────────────────────────────────────────────────────
        try {
            const buffer = await renderCalendarCard({
                botName:   config.botName || 'SUKUNA MD',
                year:      yearNum,
                monthIdx,
                monthName,
                todayDate: dayNum,
                weekday,
                fullDate,
                timeStr,
                timezone:  tzLabel,
                region:    city,
                country,
                weekNum,
                dayOfYear,
                daysInYear,
                ...(weather ? {
                    tempC:       weather.tempC,
                    condition:   weather.condition,
                    humidity:    weather.humidity,
                    windKph:     weather.windKph,
                    weatherCode: weather.weatherCode,
                } : {}),
            });

            const caption =
                `🗓️ *${monthName} ${yearNum} — ${city}, ${country}*\n` +
                `${weekday} · ${timeStr} (${tzLabel})` +
                (weather ? `\n${weather.condition}, ${weather.tempC}°C` : '');

            await sock.sendMessage(from, {
                image: buffer,
                caption,
                mimetype: 'image/png',
            }, { quoted: msg });
            return;
        } catch (e) {
            console.error('[calendar] Canvas render failed:', e.message);
        }

        // ── text fallback ───────────────────────────────────────────────
        await reply(
            `🗓️ *CALENDAR*\n\n` +
            `📅 ${fullDate}\n` +
            `🕐 ${timeStr} (${tzLabel})\n` +
            `📍 ${city}, ${country}\n` +
            `📆 Week ${weekNum} · Day ${dayOfYear}/${daysInYear}` +
            (weather ? `\n🌤️ ${weather.condition}, ${weather.tempC}°C` : '')
        );
    },
};
