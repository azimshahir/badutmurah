# Website Copy — badutmurah.my (v3, 2026-07-07)

> Copy penuh (EN + BM) kini dalam `src/i18n/en.js` dan `src/i18n/ms.js`.
> Fail ini kekal source of truth untuk versi BM; edit di sini DAN sync ke ms.js.
> Website default English, BM di /ms. `[TODO: ...]` = tanya owner, jangan reka.

## Meta / SEO (BM; EN version dalam en.js)
- **Title:** Badut Murah KL & Selangor | Badut Jim, Book Online dari RM250
- **Description:** Servis badut profesional untuk birthday party & event di KL dan Selangor. 10 tahun pengalaman sejak 2011. Harga jelas dari RM250. Semak pakej & book online sekarang.
- **OG image:** gambar hero

## Navbar
- Logo: badutmurah.my. Butang "Book Sekarang" sebelah logo.
- Links: Home · Badut Kami (Our Clown) · Pakej (Package) · "Klik sini tengok benda best!" (Edutainment Projects, styled menonjol)
- Toggle bahasa EN/BM hujung kanan.

## Hero
- **Headline:** Badut Profesional Untuk Birthday Party Anak Anda
- **Subheadline:** 10 tahun pengalaman menghiburkan kanak-kanak di seluruh KL & Selangor. Harga jelas, book online dalam 2 minit, macam book hotel.
- **Trust badges:** ✓ 10 Tahun Pengalaman · ✓ 500+ Majlis · ✓ Free Travel KL & Selangor
- **CTA pills (4):** Pakej · WhatsApp Sekarang · Gallery · FAQ
- Photo marquee auto-scroll ke kanan.

## Section: Pakej
- **Heading:** Pilih Pakej Anda
- **Subheading:** Harga jelas, takde hidden charges. Semua pakej termasuk perjalanan dalam KL & Selangor.
- (Kad pakej: render dari pricing.json; termasuk "Unlimited balloon twisting")
- **Nota bawah pakej:** Deposit RM100 untuk kunci tarikh. Baki selepas persembahan. Luar KL & Selangor? Tambahan RM50, atau bincang dulu masa booking.

## Section: Tentang Badut Kami (dulu "Kenapa Badut Jim?")
- Subheading: Kenali Jim, badut di sebalik badutmurah.my.
1. **10 Tahun Pengalaman** - Badut Jim mula menceriakan majlis sejak 2011. Ratusan majlis dah kami serikan di seluruh KL & Selangor.
2. **Kanak-Kanak Keutamaan Kami** - Persembahan disesuaikan ikut umur. Dari yang pemalu sampai yang paling aktif, semua akan terhibur.
3. **Semua Jenis Majlis** - Birthday party, majlis korporat, graduasi, kenduri kahwin sampai majlis berkhatan. Semua pernah!
- Ilustrasi: cartoon clown poses (sementara: SVG fallback clown-pose-1/2/3.svg; ganti dengan PNG generated owner)

## Page: Badut Kami (/our-clown) — DRAF, owner semak
- Intro + 3 seksyen cerita (lihat i18n ms.js `ourClown`)

## Page: Projek Edutainment (/edutainment) — DRAF, owner semak & confirm servis aktif
- Puppet Show, Magic Show, Face Painting, Mascot, Party Games (lihat i18n ms.js `edutainment`)

## Section: Gallery
- **Heading:** Detik-Detik Ceria
- **Subheading:** Sebahagian daripada majlis yang pernah kami serikan.

## Section: Testimoni
- **Heading:** Apa Kata Ibu Bapa
- [TODO: testimoni sebenar. JANGAN guna testimoni rekaan.]

## Section: FAQ (8 soalan)
1. **Kawasan mana yang anda cover?** Seluruh KL & Selangor tanpa caj tambahan. Luar KL & Selangor: tambahan RM50, atau boleh bincang dulu masa booking.
2. **Apa yang saya perlu sediakan?** Ruang untuk aktiviti (ruang tamu pun cukup) dan parking berdekatan. Selebihnya kami uruskan.
3. **Kalau nak tukar tarikh macam mana?** Percuma jika dimaklumkan sekurang-kurangnya 3 hari sebelum majlis, tertakluk kepada availability. Pembatalan saat akhir: deposit tidak dikembalikan.
4. **Balloon twisting tu untuk semua budak ke?** Ya! Stok balloon kami unlimited. Setiap kanak-kanak dapat, mak budak nak sekali pun boleh.
5. **Boleh buat event selain birthday?** Boleh! Badut Jim ada pengalaman majlis korporat, graduasi, kenduri kahwin, majlis politik bahkan majlis berkhatan. Kenduri arwah je belum.
6. **Berapa awal saya perlu book?** Seawal yang boleh! Tarikh popular (cuti sekolah, hujung minggu) cepat penuh. First come first served, deposit RM100 kunci tarikh anda. *(baru, draf)*
7. **Macam mana nak bayar deposit?** Deposit RM100 melalui transfer atau DuitNow selepas kami confirm availability. Baki dibayar selepas persembahan, cash atau transfer. *(baru, draf)*
8. **Ada servis lain selain badut?** Ada! Puppet show, magic show, face painting, mascot dan party games. Tengok page Projek Edutainment kami atau WhatsApp untuk tanya. *(baru, draf)*

## Section: Booking Form
- **Heading:** Book Sekarang
- **Subheading:** Isi maklumat di bawah. Kami confirm dalam 1 jam. Belum bayar apa-apa lagi, deposit hanya selepas kami confirm availability.
- Fields: rujuk booking-spec.md
- **Butang:** Hantar Booking
- **Success:** Booking diterima! 🎈 Kami akan WhatsApp anda dalam masa 1 jam untuk confirm. Terima kasih!
- **Error:** Alamak, ada masalah teknikal. Sila cuba lagi atau WhatsApp kami terus.

## Floating WhatsApp Button
- **wa.me prefill (BM):** "Hi Jim! Saya nak tanya pasal servis badut untuk majlis saya."
- **wa.me prefill (EN):** "Hi Jim! I'd like to ask about your clown service for my event."
- Nombor WhatsApp: 60179949524

## Footer
- **Tagline:** Menceriakan majlis kanak-kanak sejak 2011.
- **Coverage:** Kuala Lumpur · Selangor · Seremban · Nilai
- **Links:** Facebook (facebook.com/Badutjim) · TikTok (tiktok.com/@badut.jeem) · Instagram (instagram.com/badutjim)
- **Contact:** WhatsApp 60179949524 · Email badutjim@gmail.com
- **Copyright:** © 2026 badutmurah.my

## Nota gaya
- JANGAN guna em dash dalam copy customer-facing. Guna koma atau ayat pendek.
