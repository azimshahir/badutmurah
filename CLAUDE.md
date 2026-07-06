# badutmurah.my

Landing page + booking system untuk servis badut (children's entertainer) di KL & Selangor, Malaysia. Brand: **Badut Jim** (9 tahun experience, beroperasi semula 2026).

## Goal
Satu-page website di mana customer boleh: (1) tengok pakej & harga, (2) submit booking form, (3) tanya soalan via WhatsApp. Booking masuk sebagai notification ke phone owner. Macam booking hotel — self-serve, minimal friction.

## Stack (JANGAN tukar tanpa kebenaran)
- **Site:** Astro + Tailwind CSS. Static output. Single page (`index.astro`) + komponen.
- **Backend:** Cloudflare Pages Functions — SATU function sahaja: `functions/api/booking.js`
- **Notification:** Telegram Bot API (v1). WhatsApp Cloud API adalah v2, JANGAN implement sekarang.
- **Hosting:** Cloudflare Pages. Domain: badutmurah.my
- **No database.** Booking disimpan via notification + (optional) Google Sheets append.

## Source of truth — WAJIB baca sebelum code
- `docs/PRD.md` — scope penuh, apa yang v1 TIDAK perlu ada
- `docs/content.md` — SEMUA copy website (Bahasa Malaysia). Guna verbatim. Jangan tulis copy sendiri.
- `docs/pricing.json` — pakej, harga, travel charge, deposit. JANGAN hardcode harga dalam komponen; import dari file ini.
- `docs/booking-spec.md` — form fields, validation, payload contract, function behaviour
- `docs/design-brief.md` — arah design: modern-clean dengan sentuhan playful

## Rules
1. **Bahasa:** Semua copy customer-facing dalam Bahasa Malaysia (rujuk content.md). Code comments dalam English.
2. **Mobile-first.** 90% traffic dijangka dari phone. Test semua breakpoint dari 360px.
3. **Jangan reka fakta.** Harga, pakej, T&C, nombor phone — semua dari docs/. Kalau ada placeholder `[TODO]`, tanya owner, jangan isi sendiri.
4. **Performance:** Static site mesti kekal laju. Optimize images (webp, lazy load). Target Lighthouse 90+ mobile.
5. **SEO:** Setiap section guna semantic HTML. Meta title/description dari content.md. Keyword utama: "badut murah", "badut birthday party KL", "badut Selangor".
6. **Jangan over-engineer.** No CMS, no auth, no database, no framework tambahan. Kalau rasa nak tambah dependency, tanya dulu.
7. **Secrets:** TELEGRAM_BOT_TOKEN dan TELEGRAM_CHAT_ID adalah environment variables (Cloudflare dashboard). JANGAN commit dalam code.

## Commands
```bash
npm run dev      # local dev
npm run build    # production build
npx wrangler pages dev dist  # test Pages Functions locally
```

## Struktur
```
site/
├── src/pages/index.astro
├── src/components/   (Hero, Pakej, Gallery, Testimoni, FAQ, BookingForm, Footer)
├── functions/api/booking.js
├── public/images/    (dari assets/images/)
└── docs/             (spec files — source of truth)
```
