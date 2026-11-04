// GET /api/product?id=<listing id>&days=90   or   /api/product?upc=764503913617&days=365
// One product's price history across every store that listed it (grouped by UPC when known).
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const id = (u.searchParams.get('id') || '').slice(0, 100);
  let upc = (u.searchParams.get('upc') || '').replace(/\D/g, '').slice(0, 14);
  const days = Math.max(1, Math.min(3650, parseInt(u.searchParams.get('days') || '3650', 10) || 3650));
  const headers = { 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' };
  if ((!id && !upc) || !env.DB) return Response.json({ error: 'missing id or upc' }, { status: 400, headers });
  const cols = 'id, title, price, rounds, cpr, category, store, link, upc, sku, in_stock, first_seen, last_seen';
  let main = null;
  if (id) main = await env.DB.prepare(`SELECT ${cols} FROM listings WHERE id = ?`).bind(id).first();
  if (main && main.upc) upc = main.upc;
  const listings = upc
    ? (await env.DB.prepare(`SELECT ${cols} FROM listings WHERE upc = ? ORDER BY last_seen DESC, price ASC LIMIT 50`).bind(upc).all()).results || []
    : (main ? [main] : []);
  if (!main) main = listings[0] || null;
  if (!main) return Response.json({ error: 'not found' }, { status: 404, headers });
  const ids = listings.map(l => l.id);
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const marks = ids.map(() => '?').join(',');
  const hist = (await env.DB.prepare(`SELECT date, MIN(price) AS low, COUNT(*) AS n FROM price_log WHERE listing_id IN (${marks}) AND date >= ? GROUP BY date ORDER BY date`).bind(...ids, since).all()).results || [];
  const all = (await env.DB.prepare(`SELECT MIN(price) AS low, MAX(price) AS high, MIN(date) AS first FROM price_log WHERE listing_id IN (${marks})`).bind(...ids).first()) || {};
  return Response.json({ product: main, upc: upc || null, listings, history: hist, lowest: all.low, highest: all.high, tracked_since: all.first }, { headers });
}
