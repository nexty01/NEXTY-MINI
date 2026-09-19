/**
 * Health & Drugs Manager — extends the economy with sickness mechanics.
 *
 * Stored in data/health.json:
 *   { "<id>": { health: 100, sickness: null, occupation: null,
 *               drugs: { aspirin: 2, ... }, lastTick: <ts> } }
 *
 * Players naturally lose a little health over time and can randomly catch a
 * sickness. Drugs (bought from `.drugs buy`) cure specific illnesses.
 */
const fs   = require('fs');
const path = require('path');

const DATA_FILE = path.join(__dirname, '..', 'data', 'health.json');

const SICKNESSES = {
    cold:      { name: 'Common Cold',  emoji: '🤧', dmgPerHour: 2,  cure: ['aspirin', 'syrup'] },
    flu:       { name: 'Flu',          emoji: '🤒', dmgPerHour: 4,  cure: ['antibiotic', 'syrup'] },
    headache:  { name: 'Headache',     emoji: '🤕', dmgPerHour: 1,  cure: ['aspirin', 'painkiller'] },
    fever:     { name: 'Fever',        emoji: '🥵', dmgPerHour: 5,  cure: ['antibiotic', 'painkiller'] },
    stomachflu:{ name: 'Stomach Flu',  emoji: '🤢', dmgPerHour: 3,  cure: ['syrup', 'antibiotic'] },
    insomnia:  { name: 'Insomnia',     emoji: '😵', dmgPerHour: 2,  cure: ['sleeppill'] },
    burnout:   { name: 'Burnout',      emoji: '😮‍💨', dmgPerHour: 3, cure: ['vitamin', 'sleeppill'] },
};

const DRUGS = {
    aspirin:    { name: '💊 Aspirin',         price: 200,  desc: 'Mild painkiller — cures cold & headache' },
    syrup:      { name: '🧪 Cough Syrup',     price: 350,  desc: 'Soothes cold, flu & stomach flu' },
    antibiotic: { name: '💉 Antibiotic',      price: 800,  desc: 'Strong cure for flu, fever & stomach flu' },
    painkiller: { name: '🩹 Painkiller',      price: 500,  desc: 'Cures headache & fever' },
    sleeppill:  { name: '😴 Sleep Pill',      price: 600,  desc: 'Cures insomnia & burnout' },
    vitamin:    { name: '🍊 Vitamin Pack',    price: 400,  desc: 'Restores 25 HP and helps burnout' },
    morphine:   { name: '🧬 Morphine (rare)', price: 2500, desc: 'Cures ANY sickness instantly' },
};

const OCCUPATIONS = {
    doctor:     { name: '👨‍⚕️ Doctor',     salary: 1500, sickChance: 0.10, desc: 'Heals others; rarely gets sick.' },
    chef:       { name: '👨‍🍳 Chef',        salary: 1100, sickChance: 0.18 },
    coder:      { name: '💻 Programmer',  salary: 1300, sickChance: 0.20, desc: 'High burnout risk.' },
    miner:      { name: '⛏️ Miner',       salary: 1000, sickChance: 0.30 },
    farmer:     { name: '👨‍🌾 Farmer',     salary: 800,  sickChance: 0.15 },
    fighter:    { name: '🥊 Fighter',     salary: 1400, sickChance: 0.35 },
    teacher:    { name: '👨‍🏫 Teacher',    salary: 950,  sickChance: 0.12 },
    racer:      { name: '🏎️ Racer',       salary: 1600, sickChance: 0.40 },
    streamer:   { name: '🎮 Streamer',    salary: 1200, sickChance: 0.22 },
    scientist:  { name: '🔬 Scientist',   salary: 1700, sickChance: 0.18 },
};

class HealthManager {
    constructor() {
        this.data = this._load();
    }
    _load() {
        try { if (fs.existsSync(DATA_FILE)) return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')); }
        catch (e) { console.error('[HEALTH] load:', e.message); }
        return {};
    }
    _save() {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
    }
    _id(userId) { return userId.split('@')[0].split(':')[0]; }
    _get(userId) {
        const id = this._id(userId);
        if (!this.data[id]) {
            this.data[id] = { health: 100, sickness: null, occupation: null, drugs: {}, lastTick: Date.now() };
        }
        return this.data[id];
    }

    /** Tick: apply sickness damage since last tick and roll for new illness. */
    tick(userId) {
        const u = this._get(userId);
        const now = Date.now();
        const hours = (now - (u.lastTick || now)) / 3600000;
        u.lastTick = now;

        if (u.sickness && SICKNESSES[u.sickness] && hours > 0) {
            const dmg = Math.floor(SICKNESSES[u.sickness].dmgPerHour * hours);
            u.health = Math.max(0, u.health - dmg);
        }

        // Random sickness roll: 5% per check if healthy, modified by occupation
        if (!u.sickness && Math.random() < 0.05) {
            const occ = u.occupation && OCCUPATIONS[u.occupation];
            const chance = occ ? occ.sickChance : 0.15;
            if (Math.random() < chance) {
                const keys = Object.keys(SICKNESSES);
                u.sickness = keys[Math.floor(Math.random() * keys.length)];
            }
        }
        this._save();
        return u;
    }

    getStatus(userId) { return this.tick(userId); }

    setOccupation(userId, occId) {
        if (!OCCUPATIONS[occId]) return { ok: false, reason: 'Unknown occupation.' };
        const u = this._get(userId);
        u.occupation = occId;
        this._save();
        return { ok: true, occupation: OCCUPATIONS[occId] };
    }

    buyDrug(userId, drugId, qty, economy) {
        const drug = DRUGS[drugId];
        if (!drug) return { ok: false, reason: 'Unknown drug.' };
        qty = Math.max(1, parseInt(qty, 10) || 1);
        const cost = drug.price * qty;
        const bal = economy.getBalance(userId);
        if (bal.wallet < cost) return { ok: false, reason: `Not enough cash. Need ${cost.toLocaleString()}.` };
        economy.removeWallet(userId, cost);
        const u = this._get(userId);
        u.drugs[drugId] = (u.drugs[drugId] || 0) + qty;
        this._save();
        return { ok: true, drug, qty, cost };
    }

    useDrug(userId, drugId) {
        const drug = DRUGS[drugId];
        if (!drug) return { ok: false, reason: 'Unknown drug.' };
        const u = this._get(userId);
        if (!u.drugs[drugId]) return { ok: false, reason: 'You don\'t have any of that drug.' };
        u.drugs[drugId]--;
        if (u.drugs[drugId] <= 0) delete u.drugs[drugId];

        let cured = false;
        if (drugId === 'morphine') {
            u.sickness = null; u.health = Math.min(100, u.health + 50); cured = true;
        } else if (drugId === 'vitamin') {
            u.health = Math.min(100, u.health + 25);
            if (u.sickness === 'burnout') { u.sickness = null; cured = true; }
        } else if (u.sickness && SICKNESSES[u.sickness]?.cure?.includes(drugId)) {
            u.sickness = null; u.health = Math.min(100, u.health + 20); cured = true;
        } else {
            // Wrong drug — small risk of side effect
            u.health = Math.max(0, u.health - 5);
        }
        this._save();
        return { ok: true, cured, drug, health: u.health, sickness: u.sickness };
    }
}

module.exports = {
    health: new HealthManager(),
    SICKNESSES, DRUGS, OCCUPATIONS,
};
