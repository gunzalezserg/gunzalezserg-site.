// POST /api/auth/verify {email, code} -> sets the session cookie.
const json = (o, s = 200, h = {}) => new Response(JSON.stringify(o), { status: s, headers: Object.assign({ 'content-type': 'application/json', 'cache-control': 'no-store' }, h) });
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost({ request, env }) {
  let b = {}; try { b = await request.json(); } catch (e) {}
  const email = String(b.email || '').trim().toLowerCase();
  const code = String(b.code || '').replace(/\D/g, '');
  const now = Date.now();
  const row = await env.DB.prepare('SELECT code_hash, expires, tries FROM auth_codes WHERE email = ?').bind(email).first();
  if (!row || Number(row.expires) < now) return json({ ok: false, error: 'That code expired. Get a new one.' }, 400);
  if (Number(row.tries) >= 5) { await env.DB.prepare('DELETE FROM auth_codes WHERE email = ?').bind(email).run(); return json({ ok: false, error: 'Too many wrong tries. Get a new code.' }, 429); }
  if (code.length !== 6 || (await sha(email + ':' + code)) !== row.code_hash) {
    await env.DB.prepare('UPDATE auth_codes SET tries = tries + 1 WHERE email = ?').bind(email).run();
    return json({ ok: false, error: 'Wrong code. Check the email and try again.' }, 400);
  }
  await env.DB.prepare('DELETE FROM auth_codes WHERE email = ?').bind(email).run();
  const raw = crypto.getRandomValues(new Uint8Array(32));
  const token = btoa(String.fromCharCode(...raw)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const days = 30;
  await env.DB.prepare('DELETE FROM sessions WHERE expires < ?').bind(now).run();
  await env.DB.prepare('INSERT INTO sessions (token_hash, email, role, expires) VALUES (?, ?, ?, ?)').bind(await sha(token), email, 'admin', now + days * 864e5).run();
  return json({ ok: true, email, role: 'admin' }, 200, { 'set-cookie': `gs_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${days * 86400}` });
}
