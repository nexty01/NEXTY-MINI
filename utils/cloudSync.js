/**
 * Mirrors local economy.json to Lovable Cloud.
 * For each WhatsApp number that has a linked profile, pushes wallet/bank/inventory.
 * Runs in the background; never blocks bot commands.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || '';
const enabled = !!(SUPABASE_URL && SUPABASE_SERVICE_KEY);

const fetchFn = global.fetch;
const headers = (prefer) => ({
    apikey: SUPABASE_SERVICE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
});

async function rest(path, opts = {}) {
    const res = await fetchFn(`${SUPABASE_URL}/rest/v1/${path}`, { ...opts, headers: headers(opts.prefer) });
    if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
    return res.status === 204 ? null : JSON.parse((await res.text()) || 'null');
}

// Resolve WA -> uid (cached for 5 min)
const cache = new Map();
async function uidFor(wa) {
    const hit = cache.get(wa);
    if (hit && Date.now() - hit.t < 5 * 60_000) return hit.uid;
    try {
        const rows = await rest(`profiles?whatsapp_number=eq.${wa}&select=id`);
        const uid = rows?.[0]?.id || null;
        cache.set(wa, { uid, t: Date.now() });
        return uid;
    } catch { return null; }
}

let syncing = false, queued = false, lastData = null;
async function syncAll(data) {
    lastData = data;
    if (syncing) { queued = true; return; }
    syncing = true;
    try {
        for (const [wa, u] of Object.entries(lastData)) {
            const uid = await uidFor(wa);
            if (!uid) continue;
            await rest(`wallets?user_id=eq.${uid}`, {
                method: 'PATCH',
                body: JSON.stringify({
                    wallet: u.wallet || 0,
                    bank: u.bank || 0,
                    total_earned: u.totalEarned || 0,
                    updated_at: new Date().toISOString(),
                }),
            }).catch(() => {});
            // Inventory: upsert each item (don't delete stale; safer)
            for (const [itemId, qty] of Object.entries(u.inventory || {})) {
                if (!qty) continue;
                const existing = await rest(`inventory?user_id=eq.${uid}&item_id=eq.${itemId}&select=id`).catch(() => null);
                if (existing?.[0]) {
                    await rest(`inventory?id=eq.${existing[0].id}`, { method: 'PATCH', body: JSON.stringify({ quantity: qty }) }).catch(() => {});
                } else {
                    await rest('inventory', { method: 'POST', body: JSON.stringify({ user_id: uid, item_id: itemId, quantity: qty }) }).catch(() => {});
                }
            }
        }
    } finally {
        syncing = false;
        if (queued) { queued = false; setTimeout(() => syncAll(lastData), 250); }
    }
}

module.exports = { enabled, syncAll };
