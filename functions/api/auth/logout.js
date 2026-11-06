// POST /api/auth/logout
async function sha(s) { const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s)); return [...new Uint8Array(b)].map(x => x.toString(16).padStart(2, '0')).join(''); }
export async function onRequestPost({ request, env }) {
  const m = (request.headers.get('cookie') || '').match(/(?:^|;\s*)gs_session=([A-Za-z0-9_-]{20,})/);
  if (m) await env.DB.prepare('DELETE FROM sessions WHERE token_hash = ?').bind(await sha(m[1])).run();
  return new Response('{"ok":true}', { headers: { 'content-type': 'application/json', 'set-cookie': 'gs_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0' } });
}
