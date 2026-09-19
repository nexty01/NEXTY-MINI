/**
 * Cloud Economy Manager — backs progress to Lovable Cloud (Supabase).
 * Users are linked by their WhatsApp number via public.profiles.whatsapp_number.
 * Falls back to an in-memory placeholder profile when SUPABASE_* env vars are missing.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://malevolentkingsukunamdbot.lovable.app';

const CURRENCY = 'PASQUA Bucks 💵';
const SYMBOL = '💵';

// ===== Catalogs (kept in sync with website /src/lib/economy.ts) =====
const SHOP_ITEMS = {
    shield:     { name: '🛡️ Shield',         price: 5000,  description: 'Blocks robbery attempts for 1h',          type: 'usable' },
    luckycharm: { name: '🍀 Lucky Charm',     price: 7500,  description: '+15% gambling win for 30m',               type: 'usable' },
    robbermask: { name: '🎭 Robber Mask',     price: 4000,  description: '+20% rob success for 1 use',              type: 'single_use' },
    xpbooster:  { name: '⚡ XP Booster',      price: 3000,  description: 'Doubles work earnings for 1h',            type: 'usable' },
    goldenbag:  { name: '💰 Golden Bag',      price: 15000, description: 'Max wallet 100k',                          type: 'permanent' },
    fishinrod:  { name: '🎣 Fishing Rod',     price: 2500,  description: 'Unlocks fishing',                          type: 'permanent' },
};

const PET_SHOP = {
    divinedog:  { name: '🐕 Divine Dog',          price: 25000,  passive: 600,  description: '+600/h passive' },
    nue:        { name: '🦅 Nue',                 price: 40000,  passive: 950,  description: '+950/h passive, faster travel' },
    toad:       { name: '🐸 Great Serpent Toad',  price: 18000,  passive: 420,  description: '+420/h passive' },
    rabbitescape:{ name: '🐰 Rabbit Escape',      price: 22000,  passive: 0,    description: '+25% rob escape' },
    mahoraga:   { name: '👹 Mahoraga',            price: 250000, passive: 5000, description: 'Doubles all crime payouts' },
    blackbird:  { name: '🐦 Black Bird',          price: 60000,  passive: 1500, description: 'Unlocks Black Market discounts' },
};

const CHARACTERS = {
    yuji:    { name: 'Yuji Itadori',     rarity: 'rare',      price: 30000,   emoji: '👊' },
    megumi:  { name: 'Megumi Fushiguro', rarity: 'rare',      price: 32000,   emoji: '🐺' },
    nobara:  { name: 'Nobara Kugisaki',  rarity: 'rare',      price: 28000,   emoji: '🔨' },
    inumaki: { name: 'Toge Inumaki',     rarity: 'epic',      price: 55000,   emoji: '🍙' },
    panda:   { name: 'Panda',            rarity: 'epic',      price: 50000,   emoji: '🐼' },
    maki:    { name: 'Maki Zenin',       rarity: 'epic',      price: 60000,   emoji: '⚔️' },
    todo:    { name: 'Aoi Todo',         rarity: 'epic',      price: 65000,   emoji: '🤜' },
    nanami:  { name: 'Kento Nanami',     rarity: 'epic',      price: 70000,   emoji: '💼' },
    yuta:    { name: 'Yuta Okkotsu',     rarity: 'legendary', price: 150000,  emoji: '🗡️' },
    gojo:    { name: 'Satoru Gojo',      rarity: 'legendary', price: 250000,  emoji: '🔵' },
    geto:    { name: 'Suguru Geto',      rarity: 'legendary', price: 200000,  emoji: '🌑' },
    choso:   { name: 'Choso',            rarity: 'legendary', price: 140000,  emoji: '🩸' },
    mahito:  { name: 'Mahito',           rarity: 'legendary', price: 180000,  emoji: '🎭' },
    jogo:    { name: 'Jogo',             rarity: 'legendary', price: 160000,  emoji: '🌋' },
    kenjaku: { name: 'Kenjaku',          rarity: 'mythic',    price: 400000,  emoji: '🧠' },
    sukuna:  { name: 'Ryomen Sukuna',    rarity: 'mythic',    price: 1000000, emoji: '👹' },
};

const LOCATIONS = {
    tokyo:      { name: '🏯 Tokyo Jujutsu High',  cost: 0,     description: 'Home base. Standard rates.' },
    kyoto:      { name: '⛩️ Kyoto Jujutsu High',  cost: 5000,  description: '+15% work payout' },
    shibuya:    { name: '🌃 Shibuya',             cost: 12000, description: '+30% rob success' },
    shinjuku:   { name: '🌆 Shinjuku',            cost: 18000, description: 'Black Market unlocked' },
    malevolent: { name: '⛩️ Malevolent Shrine',   cost: 75000, description: 'Crime ×2, fines +50%' },
};

const CRIMES = {
    pickpocket: { name: 'Pickpocket',  emoji: '🪙', minPayout: 500,   maxPayout: 2000,  successRate: 0.8,  fine: 1000,  cooldownMs: 5*60_000 },
    mugging:    { name: 'Mugging',     emoji: '🔪', minPayout: 2000,  maxPayout: 6000,  successRate: 0.6,  fine: 4000,  cooldownMs: 15*60_000 },
    heist:      { name: 'Bank Heist',  emoji: '🏦', minPayout: 8000,  maxPayout: 25000, successRate: 0.4,  fine: 15000, cooldownMs: 60*60_000 },
    cursedraid: { name: 'Cursed Raid', emoji: '👹', minPayout: 25000, maxPayout: 80000, successRate: 0.25, fine: 40000, cooldownMs: 180*60_000 },
};

const BLACK_MARKET = {
    cursedfinger:   { name: '🦴 Sukuna Finger',    price: 75000,  description: '+500 max work payout (perm)' },
    forbiddenscroll:{ name: '📜 Forbidden Scroll', price: 45000,  description: 'Reset all cooldowns once' },
    voidtoken:      { name: '🌀 Void Token',       price: 120000, description: 'Skip jail next crime fail' },
    hollowpurple:   { name: '💜 Hollow Purple',    price: 200000, description: '+50% earnings 24h' },
    reverseheal:    { name: '💚 Reverse Heal',     price: 90000,  description: 'Refund last lost robbery' },
};

// ===== REST helpers =====
const enabled = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);
const fetchFn = global.fetch;

function headers(prefer) {
    return {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        'Content-Type': 'application/json',
        ...(prefer ? { Prefer: prefer } : {}),
    };
}

async function rest(path, opts = {}) {
    if (!enabled) throw new Error('Cloud not configured. Set SUPABASE_URL and SUPABASE_SERVICE_KEY.');
    const res = await fetchFn(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: { ...headers(opts.prefer), ...(opts.headers || {}) } });
    if (!res.ok) {
        const text = await res.text();
        throw new Error(`Supabase ${res.status}: ${text}`);
    }
    if (res.status === 204) return null;
    const t = await res.text();
    return t ? JSON.parse(t) : null;
}

function waNumber(senderJid) {
    return String(senderJid).split('@')[0].replace(/\D/g, '');
}

// ===== Profile / wallet helpers =====
async function getUserIdByWa(wa) {
    const rows = await rest(`profiles?whatsapp_number=eq.${wa}&select=id`, {});
    return rows?.[0]?.id || null;
}

async function ensureUser(senderJid) {
    const wa = waNumber(senderJid);
    let uid = await getUserIdByWa(wa);
    if (uid) return { uid, wa };
    return { uid: null, wa };
}

async function getWallet(uid) {
    const rows = await rest(`wallets?user_id=eq.${uid}&select=wallet,bank,total_earned`, {});
    return rows?.[0] || { wallet: 0, bank: 0, total_earned: 0 };
}

async function updateWallet(uid, patch) {
    await rest(`wallets?user_id=eq.${uid}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
    });
}

async function logTx(uid, action, amount, meta = {}) {
    await rest('transactions', {
        method: 'POST',
        body: JSON.stringify({ user_id: uid, action, amount, meta }),
    });
}

async function getCooldowns(uid) {
    const rows = await rest(`cooldowns?user_id=eq.${uid}&select=action,last_used`, {});
    const m = {};
    (rows || []).forEach(r => { m[r.action] = new Date(r.last_used).getTime(); });
    return m;
}

async function setCooldown(uid, action) {
    await rest('cooldowns', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify({ user_id: uid, action, last_used: new Date().toISOString() }),
    });
}

async function getInventory(uid) {
    return (await rest(`inventory?user_id=eq.${uid}&select=item_id,quantity`, {})) || [];
}

async function addToInventory(uid, itemId) {
    const rows = await rest(`inventory?user_id=eq.${uid}&item_id=eq.${itemId}&select=id,quantity`, {});
    if (rows?.[0]) {
        await rest(`inventory?id=eq.${rows[0].id}`, {
            method: 'PATCH',
            body: JSON.stringify({ quantity: rows[0].quantity + 1 }),
        });
    } else {
        await rest('inventory', {
            method: 'POST',
            body: JSON.stringify({ user_id: uid, item_id: itemId, quantity: 1 }),
        });
    }
}

async function getPlayerState(uid) {
    const rows = await rest(`player_state?user_id=eq.${uid}&select=location,active_pet`, {});
    return rows?.[0] || { location: 'tokyo', active_pet: null };
}

async function setPlayerLocation(uid, loc) {
    await rest('player_state', {
        method: 'POST',
        prefer: 'resolution=merge-duplicates',
        body: JSON.stringify({ user_id: uid, location: loc, updated_at: new Date().toISOString() }),
    });
}

async function getPets(uid) {
    return (await rest(`pets?user_id=eq.${uid}&select=id,pet_id,name,level`, {})) || [];
}

async function addPet(uid, petId, name) {
    await rest('pets', { method: 'POST', body: JSON.stringify({ user_id: uid, pet_id: petId, name }) });
}

async function getCharacters(uid) {
    return (await rest(`characters?user_id=eq.${uid}&select=character_id,rarity`, {})) || [];
}

async function addCharacter(uid, cid, rarity) {
    await rest('characters', { method: 'POST', body: JSON.stringify({ user_id: uid, character_id: cid, rarity }) });
}

async function logCrime(uid, crimeId, success, payout, fine) {
    await rest('crime_log', {
        method: 'POST',
        body: JSON.stringify({ user_id: uid, crime_id: crimeId, success, payout, fine }),
    });
}

// ===== Login link =====
function loginLink(wa) {
    return `${SITE_URL}/auth?wa=${encodeURIComponent(wa)}`;
}

// ===== Higher-level guard =====
async function requireLinked(senderJid, reply) {
    const { uid, wa } = await ensureUser(senderJid);
    if (!uid) {
        reply(
            `🔒 *Your WhatsApp isn't linked yet*\n\n` +
            `Sign up on the website using your WhatsApp number *${wa}* and your progress will sync everywhere.\n\n` +
            `🔗 ${loginLink(wa)}\n\n` +
            `_Then re-run this command._`
        );
        return null;
    }
    return { uid, wa };
}

module.exports = {
    enabled,
    CURRENCY, SYMBOL, SITE_URL,
    SHOP_ITEMS, PET_SHOP, CHARACTERS, LOCATIONS, CRIMES, BLACK_MARKET,
    waNumber, loginLink, rest,
    getUserIdByWa, ensureUser, requireLinked,
    getWallet, updateWallet, logTx,
    getCooldowns, setCooldown,
    getInventory, addToInventory,
    getPlayerState, setPlayerLocation,
    getPets, addPet,
    getCharacters, addCharacter,
    logCrime,
};
