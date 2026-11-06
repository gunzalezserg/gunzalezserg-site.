// POST /api/mail  — passes the email dashboard's requests to n8n (the passphrase is checked there).
const N8N = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/mail-dash-k8w3';
export async function onRequestPost({ request }) {
  const body = await request.text();
  if (body.length > 60000) return new Response(JSON.stringify({ ok: false, error: 'Message too long' }), { status: 413, headers: { 'content-type': 'application/json' } });
  try {
    const r = await fetch(N8N, { method: 'POST', headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body });
    const t = await r.text();
    return new Response(t || '{}', { status: r.status, headers: { 'content-type': 'application/json', 'cache-control': 'no-store' } });
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: 'Could not reach your automation server. Is the mini PC on?' }), { status: 502, headers: { 'content-type': 'application/json' } });
  }
}
