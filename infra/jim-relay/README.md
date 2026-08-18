# jim-relay — Cloudflare Worker

Salinan rujukan. Worker ini **tidak** di-deploy dari repo ini — ia hidup di Cloudflare
dashboard, dan `worker.js` di sini hanyalah salinan supaya kod tak hilang dan ada sejarah versi
dalam git.

## Kenapa ia wujud

Pages Function `site/functions/api/booking.js` tak boleh `fetch` terus ke `bot.badutmurah.my`
— permintaan ke hostname dalam zone Cloudflare yang sama di-route secara dalaman dan POST mati
dengan 400 kosong tanpa sampai origin. Worker ini duduk di zone `workers.dev` (bukan same-zone),
jadi permintaan keluar ikut laluan normal.

Website memanggilnya melalui **service binding** `RELAY` (lihat `site/wrangler.toml`), bukan
melalui HTTP awam.

## Laluan

| Path | Forward ke |
|---|---|
| `POST /api/website-lead` | `bot.badutmurah.my/api/website-lead` |
| `POST /api/document-list` | `bot.badutmurah.my/api/document-list` |
| `POST /api/document-issue` | `bot.badutmurah.my/api/document-issue` |

Path lain → 404. Bukan POST → 405. Tiada/salah `X-Webhook-Secret` → 401.

Status code dan `Content-Type` dari VPS dikekalkan, supaya website boleh bezakan 404 / 409 / 429.

## Deploy

Melalui dashboard (tiada langkah build):

1. `dash.cloudflare.com` → **Workers & Pages** → **jim-relay**
2. **Edit code** → padam semua → paste kandungan `worker.js`
3. **Deploy**

Selepas deploy, buat satu booking test di badutmurah.my/booking untuk sahkan laluan
`website-lead` masih elok.

**Kalau kod di dashboard diubah, kemas kini `worker.js` di sini juga** — kalau tidak, salinan ni
jadi menyesatkan, lebih teruk dari tiada salinan langsung.

## Secret

`WEBSITE_WEBHOOK_SECRET` ialah secret Worker yang ditetapkan di Cloudflare dashboard.
Ia mesti **sama** dengan yang ada pada Pages project `badutmurah` dan pada VPS.
Jangan sesekali commit nilainya.
