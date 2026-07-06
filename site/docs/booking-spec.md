# Booking Spec — Form + Pages Function

## Form fields (semua dalam BM)

| Field | Type | Required | Nota |
|---|---|---|---|
| nama | text | ✅ | "Nama anda" |
| phone | tel | ✅ | "No. WhatsApp" — validate format Malaysia (01X-XXXXXXX), strip spaces/dashes |
| tarikh | date | ✅ | Min: hari ini + 2 hari. "Tarikh majlis" |
| masa | select | ✅ | Slot: 10am, 11am, 12pm, 2pm, 3pm, 4pm, 5pm, "Lain-lain (nyatakan di nota)" |
| pakej | radio cards | ✅ | Dari pricing.json: biasa-1jam / biasa-2jam / meriah |
| lokasi | text | ✅ | "Kawasan majlis (cth: Puchong, Bukit Jalil)" |
| bil_kanak | select | ⬜ | "<10", "10-20", "20-30", "30+" |
| nota | textarea | ⬜ | "Nota tambahan (tema party, permintaan khas...)" |

Honeypot field tersembunyi (`website`) untuk spam bot — jika terisi, reject senyap.

## Payload contract — POST /api/booking

```json
{
  "nama": "Aina",
  "phone": "0123456789",
  "tarikh": "2026-08-15",
  "masa": "3pm",
  "pakej": "meriah",
  "lokasi": "Puchong",
  "bil_kanak": "10-20",
  "nota": "Tema dinosaur"
}
```

## Function behaviour (functions/api/booking.js)

1. Validate: required fields ada, phone format ok, tarikh >= hari ini + 2, pakej ID wujud dalam pricing.json, honeypot kosong
2. Hantar mesej Telegram ke owner:

```
🎈 BOOKING BARU — badutmurah.my

📅 15/08/2026, 3pm
📦 Pakej Meriah (RM400)
📍 Puchong
👤 Aina — 0123456789
👶 10-20 kanak-kanak
📝 Tema dinosaur

Reply customer: wa.me/60123456789
```

3. Return JSON `{ ok: true }` → frontend papar success message dari content.md
4. Jika gagal (Telegram down / validation fail) → `{ ok: false, error: "..." }` → frontend papar error message + fallback WhatsApp link

## Environment variables (Cloudflare dashboard, BUKAN dalam code)
- `TELEGRAM_BOT_TOKEN` — dari @BotFather
- `TELEGRAM_CHAT_ID` — chat ID owner

## Telegram API call
`POST https://api.telegram.org/bot{TOKEN}/sendMessage` dengan `chat_id` dan `text`.

## Setup Telegram (manual, 5 minit — owner buat sekali sahaja)
1. Telegram → cari @BotFather → /newbot → dapat token
2. Start chat dengan bot baru tu, hantar apa-apa mesej
3. Buka `https://api.telegram.org/bot{TOKEN}/getUpdates` → salin `chat.id`
4. Masukkan kedua-dua nilai dalam Cloudflare Pages → Settings → Environment Variables
