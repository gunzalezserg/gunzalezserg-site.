// GET /prefs?r=<record id>&f=weekly|every  — switch between one email per video and a weekly digest.
const page = (title, body) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#ECEEE9;color:#1B211E;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}main{max-width:460px;background:#FBFBF8;border:1px solid #CDD3CC;border-radius:8px;padding:24px}h1{font-size:22px;margin:0 0 8px}a{color:#9A6A12}</style></head>
<body><main><h1>${title}</h1><p>${body}</p><p><a href="/">Back to gunzalezserg.com</a></p></main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const r = u.searchParams.get('r') || '', f = u.searchParams.get('f') === 'weekly' ? 'weekly' : 'every';
  if (!/^rec[A-Za-z0-9]{14}$/.test(r)) return page('Link not recognized', 'That link looks incomplete. Reply to any of my emails and I’ll change it for you.');
  try { await env.DB.prepare('INSERT OR REPLACE INTO email_prefs (rid, freq, at) VALUES (?, ?, ?)').bind(r, f, new Date().toISOString()).run(); }
  catch (e) { return page('Something went wrong', 'Try the link again in a minute.'); }
  return f === 'weekly' ? page('Switched to weekly', 'You’ll get one email a week with my new videos instead of one per video.') : page('Switched to every video', 'You’ll get an email every time a new video drops.');
}
