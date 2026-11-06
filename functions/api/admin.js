// POST /api/admin — the admin editor's requests. Needs a signed-in admin; the secret key stays on the server.
const API = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/admin-api-r7t3qx';
const MAIL = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/mail-dash-k8w3';
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost({ request, env }) {
  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== new URL(request.url).host) return json({ ok: false, error: 'Bad origin' }, 403);
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)gs_session=([A-Za-z0-9_-]{20,})/);
  const s = m ? await env.DB.prepare('SELECT role, expires FROM sessions WHERE token_hash = ?').bind(await sha(m[1])).first() : null;
  if (!s || s.role !== 'admin' || Number(s.expires) < Date.now()) return json({ ok: false, error: 'Signed out. Sign in again.', signedOut: true }, 401);
  const text = await request.text();
  if (text.length > 60000) return json({ ok: false, error: 'Too long' }, 413);
  let b = {}; try { b = JSON.parse(text); } catch (e) { return json({ ok: false, error: 'Bad request' }, 400); }
  if (!['list', 'save', 'create', 'delete', 'publish'].includes(b.action)) return json({ ok: false, error: 'Unknown action' }, 400);
  const key = (await env.DB.prepare("SELECT v FROM config WHERE k = 'admin_key'").first() || {}).v;
  try {
    const r = await fetch(API, { method: 'POST', headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body: JSON.stringify(Object.assign({}, b, { key })) });
    const t = await r.text();
    return new Response(t || '{"ok":false,"error":"Empty reply"}', { status: r.ok ? 200 : 502, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch (e) { return json({ ok: false, error: 'Could not reach your automation server. Is the mini PC on?' }, 502); }
}
