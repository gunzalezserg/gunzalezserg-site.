# gunzalezserg.com

Gun and ammo price tracker by @gunzalezserg. Cloudflare Pages (built from this repo) + a Cloudflare D1 database.

- `public/index.html` — the site (prices, item pages, alerts, deal checker, videos, gear, builds).
- `public/data/prices.json` — tracked items, nightly price history, videos, gear, builds. Written nightly by n8n. Don't edit by hand.
- `functions/api/search.js` — `/api/search?q=` searches every store listing in the D1 database `gunzalezserg-prices`.
- `wrangler.toml` — Pages config: output folder `public`, D1 binding `DB`.
