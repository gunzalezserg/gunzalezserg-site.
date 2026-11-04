// GET /api/search?q=glock+19&cat=Handgun&days=30
// Searches every store listing in the D1 database (deal feeds now, affiliate store feeds later).
const norm = s => ' ' + String(s || '').toLowerCase().replace(/&/g, ' and ').replace(/([a-z])(\d)/g, '$1 $2').replace(/(\d)([a-z])/g, '$1 $2').replace(/[^a-z0-9]+/g, ' ').replace(/\s+/g, ' ').trim() + ' ';
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const q = (u.searchParams.get('q') || '').slice(0, 80).trim();
  const cat = (u.searchParams.get('cat') || '').slice(0, 20);
  const days = Math.max(1, Math.min(120, parseInt(u.searchParams.get('days') || '30', 10) || 30));
  const headers = { 'cache-control': 'public, max-age=300', 'access-control-allow-origin': '*' };
  if (!q || !env.DB) return Response.json({ q, results: [] }, { headers });
  const since = new Date(Date.now() - days * 864e5).toISOString().slice(0, 10);
  const code = q.replace(/[\s-]/g, '').toLowerCase();
  const cols = 'id, title, price, rounds, cpr, category, store, link, upc, sku, in_stock, last_seen';
  let sql, args;
  if (/^\d{8,14}$/.test(code) || (/^[a-z0-9]{6,20}$/.test(code) && /\d/.test(code) && /[a-z]/.test(code) && !q.includes(' '))) {
    sql = `SELECT ${cols} FROM listings WHERE last_seen >= ? AND (upc = ? OR lower(replace(sku, '-', '')) = ? OR replace(norm, ' ', '') LIKE ?)`;
    args = [since, code, code, '%' + code + '%'];
  } else {
    const toks = norm(q).trim().split(' ').filter(Boolean).slice(0, 8);
    sql = `SELECT ${cols} FROM listings WHERE last_seen >= ?`;
    args = [since];
    for (const t of toks) { sql += ' AND norm LIKE ?'; args.push('% ' + t + ' %'); }
  }
  if (cat) { sql += ' AND category = ?'; args.push(cat); }
  sql += ' ORDER BY (cpr IS NULL), cpr, price LIMIT 60';
  try {
    const r = await env.DB.prepare(sql).bind(...args).all();
    return Response.json({ q, results: r.results || [] }, { headers });
  } catch (e) {
    return Response.json({ q, results: [], error: 'search failed' }, { status: 500, headers });
  }
}
