// GET /api/auth/me -> who is signed in.
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestGet({ request, env }) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)gs_session=([A-Za-z0-9_-]{20,})/);
  let row = null;
  if (m) row = await env.DB.prepare('SELECT email, role, expires FROM sessions WHERE token_hash = ?').bind(await sha(m[1])).first();
  const ok = !!row && Number(row.expires) > Date.now();
  return new Response(JSON.stringify(ok ? { ok: true, email: row.email, role: row.role } : { ok: false }), { headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
}
