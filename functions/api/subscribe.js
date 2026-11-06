// POST /api/subscribe  {email, freq, name, hp} — website signup for "email me when a new video drops".
const N8N = 'https://perfectly-deranged-masses.ngrok-free.dev/webhook/email-signup-v2n6';
const json = (o, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { 'content-type': 'application/json' } });
export async function onRequestPost({ request }) {
  let b = {};
  try { b = await request.json(); } catch (e) { return json({ ok: false, error: 'Bad request' }, 400); }
  if (b.hp) return json({ ok: true }); // bot honeypot
  const email = String(b.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email) || email.length > 200) return json({ ok: false, error: 'That email doesn’t look right.' }, 400);
  const freq = b.freq === 'weekly' ? 'Weekly digest' : 'Every post';
  try {
    const r = await fetch(N8N, { method: 'POST', headers: { 'content-type': 'application/json', 'ngrok-skip-browser-warning': '1' }, body: JSON.stringify({ key: 'es214-Wm3kT8qR', email, freq, name: String(b.name || '').slice(0, 60), source: 'Website' }) });
    if (!r.ok) throw 0;
    return json({ ok: true });
  } catch (e) { return json({ ok: false, error: 'Signup is down for a minute. Try again shortly.' }, 502); }
}
