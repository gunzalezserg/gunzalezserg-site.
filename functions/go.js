// GET /go?r=<rule id>&e=<event>&p=ig|fb&u=<user>  — tracked DM link.
// Asks n8n (DM Link Redirect) for the rule's real link, which also logs the click in Airtable.
// If n8n is down or slow, uses the last known link for that rule so the tap still works.
const N8N = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/go-214';
const HOME = 'https://www.instagram.com/gunzalezserg/';
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const r = u.searchParams.get('r') || '';
  if (!/^rec[A-Za-z0-9]{14}$/.test(r)) return Response.redirect(HOME, 302);
  const q = new URLSearchParams({ r, e: (u.searchParams.get('e') || '').slice(0, 200), p: u.searchParams.get('p') === 'fb' ? 'fb' : 'ig', u: (u.searchParams.get('u') || '').slice(0, 100) });
  let dest = '';
  try {
    const ac = new AbortController(); const t = setTimeout(() => ac.abort(), 4000);
    const res = await fetch(N8N + '?' + q.toString(), { redirect: 'manual', signal: ac.signal, headers: { 'ngrok-skip-browser-warning': '1', 'user-agent': 'gunzalezserg-go/1' } });
    clearTimeout(t);
    const loc = res.headers.get('location') || '';
    if (res.status >= 300 && res.status < 400 && /^https?:\/\//i.test(loc)) dest = loc;
  } catch (e) {}
  try {
    if (dest && env.DB) await env.DB.prepare('INSERT OR REPLACE INTO dm_links (rule_id, url, updated) VALUES (?, ?, ?)').bind(r, dest, new Date().toISOString()).run();
    if (!dest && env.DB) { const row = await env.DB.prepare('SELECT url FROM dm_links WHERE rule_id = ?').bind(r).first(); if (row && /^https?:\/\//i.test(row.url)) dest = row.url; }
  } catch (e) {}
  return new Response(null, { status: 302, headers: { location: dest || HOME, 'cache-control': 'no-store', 'referrer-policy': 'no-referrer' } });
}
