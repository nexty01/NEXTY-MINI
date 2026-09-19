/**
 * Economy Manager — PASQUA Bucks 💵 economy system
 * Persistent JSON storage for wallets, banks, inventories, cooldowns
 */

const fs = require('fs');
const path = require('path');
const cloudSync = (() => { try { return require('./cloudSync'); } catch { return null; } })();


const DATA_FILE = path.join(__dirname, '..', 'data', 'economy.json');
const CURRENCY = 'PASQUA Bucks 💵';
const SYMBOL = '💵';

// Shop items
const SHOP_ITEMS = {
    shield: {
        name: '🛡️ Shield',
        price: 5000,
        description: 'Blocks robbery attempts for 1 hour',
        duration: 3600000, // 1 hour
        type: 'usable'
    },
    luckycharm: {
        name: '🍀 Lucky Charm',
        price: 7500,
        description: 'Boosts gambling win chance by 15% for 30 minutes',
        duration: 1800000, // 30 min
        type: 'usable'
    },
    robbermask: {
        name: '🎭 Robber\'s Mask',
        price: 4000,
        description: 'Increases rob success rate by 20% for 1 use',
        duration: 0,
        type: 'single_use'
    },
    xpbooster: {
        name: '⚡ XP Booster',
        price: 3000,
        description: 'Doubles work earnings for 1 hour',
        duration: 3600000,
        type: 'usable'
    },
    goldenbag: {
        name: '💰 Golden Bag',
        price: 15000,
        description: 'Increases max wallet capacity to 100,000',
        duration: 0,
        type: 'permanent'
    },
    fishinrod: {
        name: '🎣 Fishing Rod',
        price: 2500,
        description: 'Unlocks the ability to fish for bonus Bucks',
        duration: 0,
        type: 'permanent'
    }
};

// Cooldowns in ms
const COOLDOWNS = {
    daily: 86400000,     // 24h
    work: 1800000,       // 30 min
    beg: 120000,         // 2 min
    rob: 3600000,        // 1h
    heist: 7200000,      // 2h
    interest: 43200000,  // 12h
};

class EconomyManager {
    constructor() {
        this.data = this._load();
    }

    _load() {
        try {
            if (fs.existsSync(DATA_FILE)) {
                return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
            }
        } catch (e) {
            console.error('[ECONOMY] Load error:', e.message);
        }
        return {};
    }

    _save() {
        const dir = path.dirname(DATA_FILE);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2));
        if (cloudSync && cloudSync.enabled) {
            // fire-and-forget mirror to Lovable Cloud
            try { cloudSync.syncAll(this.data).catch(() => {}); } catch {}
        }
    }

    _getUser(userId) {
        const id = userId.split('@')[0];
        if (!this.data[id]) {
            this.data[id] = {
                wallet: 0,
                bank: 0,
                inventory: {},
                cooldowns: {},
                activeEffects: {},
                totalEarned: 0
            };
        }
        return this.data[id];
    }

    // ── Balance ───────────────────────────────
    getBalance(userId) {
        const u = this._getUser(userId);
        return { wallet: u.wallet, bank: u.bank, total: u.wallet + u.bank };
    }

    // ── Wallet Operations ─────────────────────
    addWallet(userId, amount) {
        const u = this._getUser(userId);
        u.wallet += amount;
        u.totalEarned = (u.totalEarned || 0) + amount;
        this._save();
        return u.wallet;
    }

    removeWallet(userId, amount) {
        const u = this._getUser(userId);
        u.wallet = Math.max(0, u.wallet - amount);
        this._save();
        return u.wallet;
    }

    setWallet(userId, amount) {
        const u = this._getUser(userId);
        u.wallet = amount;
        this._save();
    }

    // ── Bank Operations ───────────────────────
    deposit(userId, amount) {
        const u = this._getUser(userId);
        if (amount > u.wallet) return { success: false, reason: 'Not enough in wallet' };
        u.wallet -= amount;
        u.bank += amount;
        this._save();
        return { success: true, wallet: u.wallet, bank: u.bank };
    }

    withdraw(userId, amount) {
        const u = this._getUser(userId);
        if (amount > u.bank) return { success: false, reason: 'Not enough in bank' };
        u.bank -= amount;
        u.wallet += amount;
        this._save();
        return { success: true, wallet: u.wallet, bank: u.bank };
    }

    collectInterest(userId) {
        const u = this._getUser(userId);
        const interest = Math.floor(u.bank * 0.02);
        if (interest <= 0) return { success: false, reason: 'No bank balance to earn interest on' };
        u.bank += interest;
        this._save();
        return { success: true, interest, bank: u.bank };
    }

    // ── Cooldowns ─────────────────────────────
    checkCooldown(userId, action) {
        const u = this._getUser(userId);
        const last = u.cooldowns[action] || 0;
        const cd = COOLDOWNS[action] || 0;
        const remaining = (last + cd) - Date.now();
        if (remaining > 0) {
            return { onCooldown: true, remaining };
        }
        return { onCooldown: false };
    }

    setCooldown(userId, action) {
        const u = this._getUser(userId);
        u.cooldowns[action] = Date.now();
        this._save();
    }

    // ── Shop & Inventory ──────────────────────
    getShopItems() { return SHOP_ITEMS; }

    buyItem(userId, itemId) {
        const item = SHOP_ITEMS[itemId];
        if (!item) return { success: false, reason: 'Item not found' };
        const u = this._getUser(userId);
        if (u.wallet < item.price) return { success: false, reason: `Not enough ${CURRENCY}! You need ${item.price}` };
        u.wallet -= item.price;
        if (!u.inventory[itemId]) u.inventory[itemId] = 0;
        u.inventory[itemId]++;
        this._save();
        return { success: true, item, remaining: u.wallet };
    }

    getInventory(userId) {
        const u = this._getUser(userId);
        return u.inventory || {};
    }

    useItem(userId, itemId) {
        const u = this._getUser(userId);
        if (!u.inventory[itemId] || u.inventory[itemId] <= 0) {
            return { success: false, reason: 'You don\'t have this item!' };
        }
        const item = SHOP_ITEMS[itemId];
        if (!item) return { success: false, reason: 'Item not found' };
        
        u.inventory[itemId]--;
        if (u.inventory[itemId] <= 0) delete u.inventory[itemId];
        
        if (item.duration > 0) {
            if (!u.activeEffects) u.activeEffects = {};
            u.activeEffects[itemId] = Date.now() + item.duration;
        }
        this._save();
        return { success: true, item };
    }

    hasActiveEffect(userId, effectId) {
        const u = this._getUser(userId);
        if (!u.activeEffects || !u.activeEffects[effectId]) return false;
        if (Date.now() > u.activeEffects[effectId]) {
            delete u.activeEffects[effectId];
            this._save();
            return false;
        }
        return true;
    }

    // ── Leaderboard ───────────────────────────
    getLeaderboard(limit = 10) {
        const entries = Object.entries(this.data)
            .map(([id, d]) => ({ id, total: (d.wallet || 0) + (d.bank || 0) }))
            .sort((a, b) => b.total - a.total)
            .slice(0, limit);
        return entries;
    }

    // ── Transfer ──────────────────────────────
    transfer(fromId, toId, amount) {
        const from = this._getUser(fromId);
        if (from.wallet < amount) return { success: false, reason: 'Not enough in wallet' };
        from.wallet -= amount;
        const to = this._getUser(toId);
        to.wallet += amount;
        this._save();
        return { success: true, fromWallet: from.wallet, toWallet: to.wallet };
    }
}

// Format time remaining
function formatTime(ms) {
    const s = Math.floor(ms / 1000);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    const parts = [];
    if (h) parts.push(`${h}h`);
    if (m) parts.push(`${m}m`);
    if (sec) parts.push(`${sec}s`);
    return parts.join(' ') || '0s';
}

module.exports = { economy: new EconomyManager(), CURRENCY, SYMBOL, SHOP_ITEMS, formatTime };
