// GET /api/c?l=<link id>&b=<broadcast>&r=<recipient>  — tracked email link: logs the click, then redirects.
export async function onRequestGet({ request, env }) {
  const u = new URL(request.url);
  const l = (u.searchParams.get('l') || '').slice(0, 60), b = (u.searchParams.get('b') || '').slice(0, 40), r = (u.searchParams.get('r') || '').slice(0, 40);
  let dest = 'https://gunzalezserg.com/';
  try {
    const row = await env.DB.prepare('SELECT url FROM email_links WHERE id = ?').bind(l).first();
    if (row && /^https?:\/\//.test(row.url)) dest = row.url;
    if (/^[\w-]+$/.test(b) && /^[\w-]+$/.test(r)) await env.DB.prepare("INSERT OR IGNORE INTO email_events (bid, rid, type, at) VALUES (?, ?, 'click', ?)").bind(b, r, new Date().toISOString()).run();
  } catch (e) {}
  return Response.redirect(dest, 302);
}
