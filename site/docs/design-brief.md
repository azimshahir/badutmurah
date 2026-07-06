# Design Brief — badutmurah.my

## Arah: Modern-clean dengan sentuhan playful

Bayangkan website booking hotel yang kemas dan profesional — tapi bila kau tengok detail, ada personality: warna ceria pada aksen, sudut membulat, micro-interaction yang buat senyum. **BUKAN** website circus penuh warna terabur. Ibu bapa yang bayar; mereka perlu rasa "ini profesional dan boleh dipercayai" dulu, "ini fun" kedua.

## Rujukan vibe
- Layout & spacing: Airbnb / booking.com — grid kemas, whitespace banyak, CTA jelas
- Personality: Duolingo / Headspace — playful tapi disiplin, satu-dua warna ceria sahaja pada satu masa
- JANGAN: template party-planner 2010 dengan confetti bertaburan, font Comic Sans vibes, background gradient pelangi

## Palet warna
- **Background:** Off-white hangat `#FFFBF5`
- **Teks utama:** Navy gelap `#1D3557` (bukan hitam pekat — lebih lembut)
- **Primary/CTA:** Coral merah `#EF476F` (butang, aksen penting)
- **Secondary:** Kuning hangat `#FFD166` (highlight, badge "Paling Popular", underline dekoratif)
- **Tertiary:** Teal `#06D6A0` (guna jarang — trust badges, ikon success)
- Rule: satu section maksimum 2 warna aksen. Whitespace ialah kawan.

## Typography
- **Headings:** Font display membulat & mesra — *Baloo 2* atau *Fredoka* (Google Fonts). Weight 600-700.
- **Body:** *Inter* atau *Plus Jakarta Sans*. 16-18px, line-height selesa.
- Jangan lebih 2 font family.

## Elemen playful (terkawal)
- Sudut membulat generous (border-radius 16-24px pada kad)
- Bentuk blob/lengkung organik sebagai pemisah section (SVG, subtle)
- Satu-dua doodle balloon/confetti kecil sebagai aksen — bukan wallpaper
- Hover states yang hidup: butang naik sikit, kad tilt halus
- Emoji digunakan sangat berhemat (success message ok, headings tidak)

## Layout
- Mobile-first, satu column mengalir; desktop maksimum 1100px container
- Hero: gambar sebenar Badut Jim (bukan stock photo), headline besar, CTA prominent
- Kad pakej: 3 kad sebaris (desktop) / swipe atau stack (mobile), kad "Paling Popular" ada border kuning + badge
- Booking form: rasa ringan — satu column, label jelas, butang besar penuh lebar di mobile
- Floating WhatsApp button: bawah kanan, hijau WhatsApp standard, sentiasa visible

## Gambar
- Guna gambar sebenar dari assets/images/. Prioriti set 2018.
- Treatment konsisten: border-radius sama, aspect ratio seragam dalam gallery (square atau 4:3)
- Jangan letak filter pelik; cukup crop kemas

## Accessibility & feel
- Kontras teks WCAG AA minimum
- Font size jangan bawah 14px
- Animasi hormat `prefers-reduced-motion`
- Keseluruhan feel: "Wah kemasnya. Eh comelnya detail ni. Ok senang je nak book." — dalam urutan tu.
