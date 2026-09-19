/**
 * Shared helper for the sms24 virtual-number / OTP commands.
 * Wraps the prexzyvilla vnum endpoints with timeout, retry, and
 * defensive parsing so commands don't have to repeat boilerplate.
 */

const BASE = 'https://apis.prexzyvilla.site/vnum';
const DEFAULT_TIMEOUT = 15000;

class VnumError extends Error {
    constructor(message, { kind = 'generic', status = 0 } = {}) {
        super(message);
        this.kind = kind;
        this.status = status;
    }
}

async function fetchVnum(path, params = {}, { retries = 1, timeout = DEFAULT_TIMEOUT } = {}) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') qs.set(k, String(v));
    }
    const url = `${BASE}/${path}${qs.toString() ? '?' + qs.toString() : ''}`;

    let lastErr = null;
    for (let attempt = 0; attempt <= retries; attempt++) {
        const ctrl = new AbortController();
        const timer = setTimeout(() => ctrl.abort(), timeout);
        try {
            const res = await fetch(url, {
                signal: ctrl.signal,
                headers: { 'User-Agent': 'SukunaMD/3.0', 'Accept': 'application/json' }
            });

            let json = null;
            try { json = await res.json(); } catch { /* non-json */ }

            // Upstream returns { status:false, statusCode, error } on failure
            if (json && json.status === false) {
                const sc = json.statusCode || res.status;
                if (sc >= 500 && attempt < retries) {
                    await new Promise(r => setTimeout(r, 800));
                    continue;
                }
                throw new VnumError(json.error || `sms24 returned status ${sc}`, {
                    kind: sc >= 500 ? 'upstream' : (sc === 400 ? 'badrequest' : 'generic'),
                    status: sc
                });
            }

            if (!res.ok) {
                if (res.status >= 500 && attempt < retries) {
                    await new Promise(r => setTimeout(r, 800));
                    continue;
                }
                throw new VnumError(`HTTP ${res.status}`, { kind: 'upstream', status: res.status });
            }

            return json || {};
        } catch (err) {
            if (err instanceof VnumError) throw err;
            lastErr = err;
            if (err.name === 'AbortError') {
                if (attempt < retries) continue;
                throw new VnumError('Request timed out', { kind: 'timeout' });
            }
            if (attempt < retries) {
                await new Promise(r => setTimeout(r, 800));
                continue;
            }
            throw new VnumError(err.message || 'Network error', { kind: 'network' });
        } finally {
            clearTimeout(timer);
        }
    }
    throw new VnumError(lastErr?.message || 'Unknown error', { kind: 'network' });
}

function friendlyError(err) {
    if (!(err instanceof VnumError)) {
        return `⚠️ Unexpected error: ${err.message}`;
    }
    switch (err.kind) {
        case 'timeout':  return '⏱️ sms24 took too long to respond. Try again.';
        case 'network':  return "⚠️ Couldn't reach the OTP service. Check your connection or retry.";
        case 'upstream': return '⚠️ sms24 service is temporarily unavailable. Try again in a minute.';
        case 'badrequest': return `⚠️ ${err.message}`;
        default:         return `⚠️ ${err.message}`;
    }
}

/** Find the first array inside a nested object using a list of dotted paths. */
function extractList(json, paths) {
    if (Array.isArray(json)) return json;
    if (!json || typeof json !== 'object') return [];
    for (const p of paths) {
        let cur = json;
        for (const seg of p.split('.')) {
            if (cur == null) break;
            cur = cur[seg];
        }
        if (Array.isArray(cur)) return cur;
    }
    // last resort: first array-valued property at any depth (1 level)
    for (const v of Object.values(json)) {
        if (Array.isArray(v)) return v;
        if (v && typeof v === 'object') {
            for (const v2 of Object.values(v)) {
                if (Array.isArray(v2)) return v2;
            }
        }
    }
    return [];
}

function pick(obj, ...keys) {
    for (const k of keys) {
        if (obj && obj[k] != null && obj[k] !== '') return obj[k];
    }
    return null;
}

function flagFor(code) {
    if (!code || typeof code !== 'string') return '';
    const c = code.trim().toUpperCase();
    if (c.length !== 2 || !/^[A-Z]{2}$/.test(c)) return '';
    const base = 0x1F1E6;
    return String.fromCodePoint(base + c.charCodeAt(0) - 65, base + c.charCodeAt(1) - 65);
}

function normalizeCountry(item) {
    if (typeof item === 'string') return { code: item.toLowerCase(), name: item, flag: flagFor(item) };
    const code = (pick(item, 'code', 'country', 'country_code', 'iso', 'short', 'id') || '').toString().toLowerCase();
    const name = pick(item, 'name', 'country_name', 'title', 'label') || code.toUpperCase();
    return { code, name, flag: flagFor(code) };
}

function normalizeNumber(item) {
    if (typeof item === 'string') return { number: item, country: '', service: '' };
    const number = pick(item, 'number', 'phone', 'msisdn', 'value', 'num');
    const country = pick(item, 'country', 'country_name', 'cc', 'code');
    const service = pick(item, 'service', 'app', 'category');
    const updated = pick(item, 'updated', 'last_updated', 'time', 'date');
    return { number: number ? String(number) : '', country: country || '', service: service || '', updated: updated || '' };
}

function extractOtp(text) {
    if (!text || typeof text !== 'string') return null;
    const matches = text.match(/(?<!\d)(\d{4,8})(?!\d)/g);
    if (!matches || !matches.length) return null;
    // prefer the longest, then the first occurrence
    matches.sort((a, b) => b.length - a.length);
    return matches[0];
}

function normalizeMessage(item) {
    if (typeof item === 'string') return { from: '', text: item, time: '', otp: extractOtp(item) };
    const text = pick(item, 'text', 'message', 'body', 'content', 'sms') || '';
    const from = pick(item, 'from', 'sender', 'originator', 'sender_number') || '';
    const time = pick(item, 'time', 'date', 'received', 'timestamp', 'created_at') || '';
    return { from, text: String(text), time, otp: extractOtp(String(text)) };
}

module.exports = {
    fetchVnum,
    friendlyError,
    extractList,
    extractOtp,
    normalizeCountry,
    normalizeNumber,
    normalizeMessage,
    VnumError
};
