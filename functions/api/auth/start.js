// POST /api/auth/start {email} -> emails a 6-digit sign-in code (admins only for now).
const N8N = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/admin-api-r7t3qx';
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
async function cfg(env) { const r = await env.DB.prepare('SELECT k, v FROM config').all(); const o = {}; for (const x of r.results || []) o[x.k] = x.v; return o; }
export async function onRequestPost({ request, env }) {
  let b = {}; try { b = await request.json(); } catch (e) {}
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) return json({ ok: false, error: 'Enter your email address.' }, 400);
  const c = await cfg(env);
  const admins = String(c.admin_emails || '').split(',').map(s => s.trim().toLowerCase()).filter(Boolean);
  if (!admins.includes(email)) return json({ ok: false, error: 'That email does not have an account here yet.' }, 403);
  const now = Date.now();
  const row = await env.DB.prepare('SELECT sent_at FROM auth_codes WHERE email = ?').bind(email).first();
  if (row && now - Number(row.sent_at) < 60000) return json({ ok: false, error: 'A code was just sent. Check your inbox, or wait a minute to get a new one.' }, 429);
  const code = String(crypto.getRandomValues(new Uint32Array(1))[0] % 1000000).padStart(6, '0');
  await env.DB.prepare('INSERT OR REPLACE INTO auth_codes (email, code_hash, expires, tries, sent_at) VALUES (?, ?, ?, 0, ?)').bind(email, await sha(email + ':' + code), now + 10 * 60000, now).run();
  try {
    const r = await fetch(N8N, { method: 'POST', headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body: JSON.stringify({ key: c.admin_key, action: 'sendcode', to: email, code }) });
    const j = await r.json().catch(() => ({}));
    if (!j.ok) return json({ ok: false, error: j.error || 'Could not send the code.' }, 502);
  } catch (e) { return json({ ok: false, error: 'Could not reach your automation server. Is the mini PC on?' }, 502); }
  return json({ ok: true });
}
