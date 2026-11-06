// POST /api/mail — passes the email dashboard's requests to n8n. Signed-in admins skip the passphrase.
const N8N = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/mail-dash-k8w3';
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost({ request, env }) {
  let body = await request.text();
  if (body.length > 60000) return new Response(JSON.stringify({ ok: false, error: 'Message too long' }), { status: 413, headers: { 'content-type': 'application/json' } });
  try {
    const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)gs_session=([A-Za-z0-9_-]{20,})/);
    if (m && env.DB) {
      const s = await env.DB.prepare('SELECT role, expires FROM sessions WHERE token_hash = ?').bind(await sha(m[1])).first();
      if (s && s.role === 'admin' && Number(s.expires) > Date.now()) {
        const key = (await env.DB.prepare("SELECT v FROM config WHERE k = 'admin_key'").first() || {}).v;
        const o = JSON.parse(body || '{}'); o.adminKey = key; body = JSON.stringify(o);
      }
    }
  } catch (e) {}
  try {
    const r = await fetch(N8N, { method: 'POST', headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body });
    const t = await r.text();
    return new Response(t || '{}', { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Could not reach your automation server. Is the mini PC on?' }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
