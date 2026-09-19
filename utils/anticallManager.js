const fs = require('fs');
const path = require('path');

const CONFIG_PATH = path.join(__dirname, '../data/anticall.json');
const DATA_DIR = path.join(__dirname, '../data');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const defaultConfig = {
    enabled: true,
    reason: '🚫 Your call was blocked by anti-call system.',
    unknownReason: '🚫 Calls from unknown contacts are blocked.',
    whitelist: [],
    blacklist: [],
    pendingPhoneReject: [],
    schedule: {
        enabled: false,
        type: 'once', // 'once' or 'always'
        start: '',
        end: '',
        days: [],
        dates: [],
        months: []
    }
};

// Load config from file
function loadConfig() {
    try {
        if (fs.existsSync(CONFIG_PATH)) {
            const data = fs.readFileSync(CONFIG_PATH, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error('[anticall] Config load error:', err.message);
    }
    return JSON.parse(JSON.stringify(defaultConfig));
}

// Save config to file
function saveConfig(config) {
    try {
        if (!fs.existsSync(DATA_DIR)) {
            fs.mkdirSync(DATA_DIR, { recursive: true });
        }
        fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2));
        return true;
    } catch (err) {
        console.error('[anticall] Config save error:', err.message);
        return false;
    }
}

// Normalize JID format for comparison
function normalizeJid(jid) {
    if (!jid) return '';
    return jid.replace(/[^0-9@]/g, '').toLowerCase();
}

// Find LID (Device ID) for a phone number
function findLidForPhone(phone) {
    try {
        const config = loadConfig();
        const cleanPhone = phone.replace(/[^0-9]/g, '');
        
        // Search in existing contacts
        for (const entry of [...config.whitelist, ...config.blacklist]) {
            if (entry.includes('@lid') && entry.includes(cleanPhone)) {
                return entry;
            }
        }
    } catch (err) {
        console.error('[anticall] LID search error:', err.message);
    }
    return null;
}

// Check if a caller is whitelisted
function isWhitelisted(jid) {
    if (!jid) return false;
    const config = loadConfig();
    const normalized = normalizeJid(jid);
    
    return config.whitelist.some(w => normalizeJid(w) === normalized);
}

// Check if a caller is blacklisted
function isBlacklisted(jid) {
    if (!jid) return false;
    const config = loadConfig();
    const normalized = normalizeJid(jid);
    
    return config.blacklist.some(b => normalizeJid(b) === normalized);
}

// Check if call should be blocked based on schedule
function isBlockedBySchedule(config) {
    if (!config.schedule.enabled) return false;
    
    const now = new Date();
    
    if (config.schedule.type === 'once') {
        const start = new Date(config.schedule.start);
        const end = new Date(config.schedule.end);
        return now >= start && now <= end;
    }
    
    if (config.schedule.type === 'always') {
        const currentHour = now.getHours();
        const currentMin = now.getMinutes();
        const currentTime = `${String(currentHour).padStart(2, '0')}:${String(currentMin).padStart(2, '0')}`;
        
        const [startH, startM] = config.schedule.start.split(':').map(Number);
        const [endH, endM] = config.schedule.end.split(':').map(Number);
        
        const currentTotal = currentHour * 60 + currentMin;
        const startTotal = startH * 60 + startM;
        const endTotal = endH * 60 + endM;
        
        const timeMatch = currentTotal >= startTotal && currentTotal <= endTotal;
        if (!timeMatch) return false;
        
        const dayMatch = !config.schedule.days.length || config.schedule.days.includes(now.getDay());
        const dateMatch = !config.schedule.dates.length || config.schedule.dates.includes(now.getDate());
        const monthMatch = !config.schedule.months.length || config.schedule.months.includes(now.getMonth() + 1);
        
        return dayMatch && dateMatch && monthMatch;
    }
    
    return false;
}

module.exports = {
    loadConfig,
    saveConfig,
    normalizeJid,
    findLidForPhone,
    isWhitelisted,
    isBlacklisted,
    isBlockedBySchedule,
    defaultConfig,
    CONFIG_PATH
};
