// GET /api/o?b=<broadcast>&r=<recipient>  — email open pixel.
const GIF = Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), c => c.charCodeAt(0));
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const b = (u.searchParams.get('b') || '').slice(0, 40), r = (u.searchParams.get('r') || '').slice(0, 40);
  if (/^[\w-]+$/.test(b) && /^[\w-]+$/.test(r)) { try { await env.DB.prepare("INSERT OR IGNORE INTO email_events (bid, rid, type, at) VALUES (?, ?, 'open', ?)").bind(b, r, new Date().toISOString()).run(); } catch (e) {} }
  return new Response(GIF, { headers: { 'content-type': 'image/gif', 'cache-control': 'no-store, max-age=0' } });
}
