# Design.md — Arah UI v2 (owner-approved 2026-07-07)

> Supersedes layout dalam design-brief.md. Palet warna, font, dan SEMUA copy kekal
> (rujuk content.md & pricing.json — jangan ubah ayat). Yang berubah: layout & feel.
> Rujukan visual: mockup template yang owner bagi (playful pastel, confetti, polaroid).

## Struktur page (atas ke bawah)
1. **Navbar sticky** — logo "Badut Jim" kiri; link anchor: Pakej, Gallery, FAQ; CTA pill "Book Sekarang" kanan. Mobile: logo + CTA sahaja (link sembunyi).
2. **Hero centered** — headline besar di tengah, subheadline, trust badges.
3. **Photo marquee** — strip gambar full-width auto-scroll **ke kanan** (infinite loop, seamless). Pause bila `prefers-reduced-motion`. Guna gambar dari public/images.
4. **CTA pills** — 2 butang pill bawah marquee: "Semak Pakej & Book" (coral gradient) + "Tanya Dulu di WhatsApp" (hijau WhatsApp).
5. **Pakej** — 3 kad; kad "Paling Popular" ada tint pastel + glow border coral.
6. **Kenapa Badut Jim** — 3 item, icon besar di tengah atas, teks center.
7. **Gallery "Detik-Detik Ceria"** — gaya polaroid: kad putih border tebal, rotate selang-seli, frame pastel berbeza.
8. **Cara Booking** — 3 langkah mendatar dengan bulatan nombor berwarna + anak panah antara langkah (stack di mobile).
9. **Testimoni** — kad quote bersempadan (masih placeholder sampai ada testimoni sebenar).
10. **FAQ** — baris pill rounded dengan emoji kiri + chevron kanan.
11. **Booking form** — kad putih besar, input bg pastel lembut. SEMUA field ikut booking-spec.md (jangan ringkaskan ke nama/email/mesej macam mockup).
12. **Footer** — 3 kolum: Brand info / Links / Contact. Copy dari content.md.

## Elemen dekoratif
- Confetti & belon kecil bertaburan (SVG absolute, subtle, jangan ganggu teks).
- Background cream `#FFFBF5` sekata seluruh page (tiada selang putih/cream lagi).
- Kad semua putih, rounded 16-24px.

## Motion
- Marquee: translateX loop, arah kanan, ~40-60s satu pusingan, pause on hover.
- Semua animasi hormat `prefers-reduced-motion` (marquee berhenti statik).

## Kekal dari v1 (JANGAN buang)
- Palet: cream/navy/coral #EF476F/sunny #FFD166/mint #06D6A0
- Font: Fredoka (display) + Plus Jakarta Sans (body)
- Kontras WCAG AA: butang coral mesti text ≥20px bold
- Focus-visible outline coral pada semua interactive element
- Floating WhatsApp button
- Booking form + API contract (booking-spec.md)

## v3 (2026-07-07, owner-approved)
- Multi-page: / (Home), /our-clown, /edutainment. BM mirror di /ms/*.
- i18n: EN default, BM toggle 🌐 di navbar kanan. Dictionaries: src/i18n/{en,ms}.js.
- Navbar: logo "badutmurah.my" + Book pill sebelah logo; links Home / Our Clown / Package / Edutainment (pill gradien wiggle "Click here to see cool things!").
- Hero CTA jadi 4 pill: Package / WhatsApp Now / Gallery / FAQ.
- "Kenapa Badut Jim?" jadi "About Our Clown / Tentang Badut Kami": 10 tahun pengalaman sejak 2011; ilustrasi cartoon clown (SVG fallback clown-pose-*.svg, ganti dengan PNG dari owner bila siap).
- Section Cara Booking dibuang.
- FAQ 8 soalan baru (rujuk content.md), travel charge baru: luar KL/Selangor +RM50 atau bincang.
- JANGAN guna em dash dalam copy.

## v4 (2026-07-08, owner-supplied template) — PALET & STYLE SEMASA
Owner bagi mockup HTML; design language dia diguna pakai, SEMUA content/i18n/booking kekal.
- **Palet:** cream #FDF9F0 (bg, dengan titik confetti subtle) · pink #FF6B9B → #F04E7F (gradient CTA utama) · green #5CD698 (gradient WhatsApp) · pastel blue #D1E5F4 (kad popular) · teks slate #1E293B
- **Font:** Quicksand (400/600/700) untuk semua
- **Butang utama:** rounded-full, gradient-pink/gradient-green, shadow berwarna lembut
- **Kad besar (pakej, booking form):** rounded-[40px], putih, shadow lembut; kad "Most Popular" = bg pastel blue + border putih 4px + scale
- **Gallery:** polaroid putih (padding bawah tebal), rotate selang-seli, hover tegak + zoom
- **Icon section:** bulatan pastel besar (blue/pink/yellow) dengan ilustrasi clown di dalam
- **Navbar:** putih/80 blur, avatar bulat pink "BJ" + badutmurah.my
- **Footer:** putih, teks slate lembut, social icons bulatan kecil (f/t/i)
- Squiggle heading kini pink. Marquee, wiggle, pop, focus-visible semua kekal.

## TODO / idea akan datang (owner nak tambah)
- Ganti clown-pose-*.svg dengan gambar generated owner
- (owner akan isi)
