// GET /unsubscribe?r=<request id>  — one-click unsubscribe from Gun Finder / price alert emails.
const page = (title, body) => new Response(`<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${title}</title>
<style>body{font:16px/1.5 system-ui,sans-serif;background:#ECEEE9;color:#1B211E;display:grid;place-items:center;min-height:100vh;margin:0;padding:16px}main{max-width:460px;background:#FBFBF8;border:1px solid #CDD3CC;border-radius:8px;padding:24px}h1{font-size:22px;margin:0 0 8px}a{color:#9A6A12}</style></head>
<body><main><h1>${title}</h1><p>${body}</p><p><a href="/">Back to the price tracker</a></p></main></body></html>`, { headers: { 'content-type': 'text/html; charset=utf-8' } });
export async function onRequestGet({ request, env }) {
  const r = new URL(request.url).searchParams.get('r') || '';
  if (!/^rec[A-Za-z0-9]{14}$/.test(r)) return page('Link not recognized', 'That unsubscribe link looks incomplete. Reply to any alert email and I\'ll take you off the list by hand.');
  try { await env.DB.prepare('INSERT OR IGNORE INTO unsubscribes (req_id, at) VALUES (?, ?)').bind(r, new Date().toISOString()).run(); }
  catch (e) { return page('Something went wrong', 'I couldn\'t save that just now. Try the link again in a minute, or reply to the email.'); }
  return page("You're unsubscribed", "You won't get these emails anymore. You can sign up again any time on the site.");
}
