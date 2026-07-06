# PRD — badutmurah.my (v1)

## Masalah
Booking badut sekarang berlaku melalui PM Facebook/Mudah/Carousell — banyak soal jawab berulang (harga? area? macam mana book?). Owner buang masa reply soalan sama, customer pula tak dapat harga transparent.

## Penyelesaian
Website satu page dengan harga transparent + booking form self-serve. Customer boleh book tanpa perlu tanya apa-apa. Soalan luar biasa sahaja masuk WhatsApp.

## Target user
Ibu bapa (25-45 tahun) di KL/Selangor yang plan birthday party anak. Browsing dari phone, jumpa site melalui Google search / FB / TikTok. Nak jawapan cepat: berapa harga, cover area saya tak, macam mana nak book.

## Success metrics (3 bulan pertama)
- 2-4 booking sebulan melalui website
- Booking form completion tanpa perlu WhatsApp dulu (target: 50% booking terus dari form)
- Google Search Console: muncul untuk keyword "badut murah" dalam top 10

## Scope v1 (WAJIB ada)
1. Hero — tagline + gambar + CTA "Semak Pakej & Book"
2. Pakej — 2 pakej, 3 pilihan harga, dari pricing.json
3. Gallery — 6-8 gambar terbaik
4. Testimoni — 2-3 (placeholder dulu jika belum ada)
5. FAQ — 8 soalan dari content.md
6. Booking form → POST /api/booking → Telegram notification → success message
7. Floating WhatsApp button (wa.me link, prefilled message)
8. Footer — area coverage, contact, social links
9. SEO basics — meta tags, OG image, sitemap, semantic HTML

## Scope v2 (JANGAN buat dalam v1)
- WhatsApp Cloud API notification (ganti Telegram)
- Real-time calendar availability check
- Online deposit payment (DuitNow/FPX)
- Google Sheets booking log
- n8n workflows (reminder, follow-up)
- Blog/SEO content pages

## Non-goals
- Multi-bahasa (BM sahaja untuk v1)
- Admin dashboard
- Customer accounts

## Launch checklist
- [ ] Deploy ke Cloudflare Pages
- [ ] Connect domain badutmurah.my + SSL
- [ ] Test booking end-to-end dari phone sebenar
- [ ] Submit sitemap ke Google Search Console
- [ ] Setup Google Business Profile dengan link ke site
