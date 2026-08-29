# Booking Spec — /booking page + Pages Function

> v2 (2026-07-08): booking form dipindah dari homepage ke page `/booking` berasingan
> (dan `/ms/booking`). `/package` (+ `/ms/package`) papar kad pakej sahaja, semua CTA
> pakej hantar ke `/booking`. Rujuk pricing.json untuk struktur pakej terkini.

## Form fields (semua dalam BM/EN ikut locale)

| Field | Type | Required | Nota |
|---|---|---|---|
| clown | display sahaja | - | "Jim The Clown" — fixed text, bukan input, sedia untuk tambah badut lain nanti |
| nama | text | ✅ | "Nama anda" |
| phone | tel | ✅ | "No. WhatsApp" — validate format Malaysia (01X-XXXXXXX), strip spaces/dashes |
| tarikh | date | ✅ | Min: hari ini + 2 hari. "Tarikh majlis" |
| masa | text (free text) | ✅ | **Bukan dropdown/slot tetap** — customer taip sendiri (cth "1.30 petang", "8 malam"). Boleh apa-apa masa termasuk tengah malam |
| pakej | radio | ✅ | "basic" atau "meriah" |
| durasi | radio | ✅ jika pakej=basic sahaja | Hanya papar & wajib bila Basic Package dipilih: "1jam" (RM250), "2jam" (RM400), "3jam-lebih" (harga TBD) |
| prize | radio | ✅ jika pakej=meriah sahaja | Hanya papar & wajib bila Game Package dipilih. Nilai sah datang dari `pricing.json`: RM20, RM50, RM100, RM200, RM500 |
| lokasi | text | ✅ | "Kawasan majlis (cth: Puchong, Bukit Jalil)" |
| nota | textarea | ⬜ | Pre-filled template bold: "**Event:** / **Birthday Boy/Girl Name:** / **Theme:** / **Special Request:**" — customer boleh edit/padam |

Honeypot field tersembunyi (`website`) untuk spam bot — jika terisi, reject senyap.

Package selection dari homepage/`/package` disimpan dalam `sessionStorage` (`badutmurah_pakej`) dan auto-preselect bila customer sampai `/booking`.

Bawah form ada 2 CTA: **Send Booking** (submit form) dan **WhatsApp Now** (terus buka WhatsApp, tak perlu isi form).

## Payload contract — POST /api/booking

```json
{
  "nama": "Aina",
  "phone": "0123456789",
  "tarikh": "2026-08-15",
  "masa": "3.30 petang",
  "pakej": "meriah",
  "prize": "20",
  "lokasi": "Puchong",
  "nota": "**Event:** Birthday\n**Birthday Boy/Girl Name:** Aiman\n**Theme:** Dinosaur\n**Special Request:** "
}
```

`durasi` hanya dihantar (dan divalidate) bila `pakej` = `"basic"`. `prize` hanya dihantar (dan divalidate) bila `pakej` = `"meriah"` (Game Package), dan wajib sepadan dengan salah satu `prize_options` dalam `pricing.json`. Untuk Game Package, durasi & harga pakej kekal (1 jam 30 minit, RM400); pilihan prize tidak mengubah harga pakej dalam payload.

## Function behaviour (functions/api/booking.js)

1. Validate: required fields ada, phone format ok, tarikh >= hari ini + 2, pakej ID + durasi (jika basic) + prize (jika Game Package) wujud dalam pricing.json, honeypot kosong
2. Resolve nama pakej + durasi + harga dari `pricing.json` (harga `null` untuk "Lebih 3 jam" → papar "Harga kena bincang" dalam mesej)
3. Hantar mesej Telegram ke owner:

```
🎈 BOOKING BARU: badutmurah.my

🤡 Badut: Jim The Clown
📅 15/08/2026, 3.30 petang
📦 Game Package 1 jam 30 minit (RM400)
🎁 Prize: RM20
📍 Puchong
👤 Aina - 0123456789

**Event:** Birthday
**Birthday Boy/Girl Name:** Aiman
**Theme:** Dinosaur
**Special Request:** 

Reply customer: wa.me/60123456789
```

4. Return JSON `{ ok: true }` → frontend papar success message
5. Jika gagal (Telegram down / validation fail) → `{ ok: false, error: "..." }` → frontend papar error message + fallback WhatsApp link

## Environment variables (Cloudflare dashboard, BUKAN dalam code)
- `TELEGRAM_BOT_TOKEN` — dari @BotFather
- `TELEGRAM_CHAT_ID` — chat ID owner

## Telegram API call
`POST https://api.telegram.org/bot{TOKEN}/sendMessage` dengan `chat_id` dan `text`.
