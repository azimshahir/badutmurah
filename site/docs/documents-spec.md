# Documents Spec — `/documents` page + Pages Function

Customer masukkan **no. phone sahaja**, pilih booking, edit blok "bill to", dan dapat
quotation / invoice / resit untuk print atau simpan sebagai PDF.

Semua data milik **Hermes** di VPS. Website tidak simpan apa-apa — ia hanya validate dan proxy.

## Aliran

```
/documents  (Astro static, noindex)
  1. POST /api/documents  { action:"list", phone }        → senarai booking ringkas
  2. POST /api/documents  { action:"issue", phone, lead_id, type, billing }
                                                          → data dokumen penuh
        │
        ▼
  functions/api/documents.js  →  env.RELAY  →  jim-relay  →  bot.badutmurah.my  →  Hermes
```

Dua langkah supaya panggilan pertama hanya dedah tarikh + pakej, bukan nama/alamat/harga.

## Endpoint Hermes

| Path | Guna |
|---|---|
| `POST /api/document-list` | Senarai booking untuk satu phone |
| `POST /api/document-issue` | Jana satu dokumen + simpan blok billing |

Kedua-dua perlukan header `X-Webhook-Secret` (secret sama dengan `/api/website-lead`).

## Jenis dokumen & kelayakan

| Jenis | Nombor | Bila tersedia |
|---|---|---|
| Quotation | `Q-YYYY-NNNN` | Sentiasa |
| Invoice | `INV-YYYY-NNNN` | Status `confirmed` ke atas |
| Receipt | `BJ-YYYY-NNNN` (= Bill No) | Selepas bayaran direkod |

Nombor dijana **sekali** oleh Hermes dan disimpan — buka dokumen sama sepuluh kali, nombor kekal.
Bill No hanya wujud selepas bayaran, sebab itu quotation dan invoice ada siri sendiri.

## Blok billing

Empat medan yang customer boleh edit: `nama` (wajib), `alamat`, `phone` (wajib), `email`.
Prefill dari data booking, disimpan dalam Hermes sebagai blok `billing` **berasingan** —
data booking asal tidak sekali-kali ditimpa.

Hanya blok kepala dokumen yang customer boleh ubah. Harga, item dan butiran majlis datang dari
Hermes dan tidak boleh diubah dari browser.

## Keselamatan

- Kunci carian ialah **phone sahaja**. Hermes rate-limit permintaan.
- `document-issue` mesti sahkan phone **asal lead** padan dengan `phone` di peringkat atas
  request — bukan `billing.phone`, yang customer boleh tukar kepada apa-apa.
- 404 digunakan untuk "booking tak wujud" DAN "phone bukan pemilik" — mesej sama, supaya
  endpoint tak boleh digunakan untuk meneka.
- Phone dan `lead_id` tidak pernah masuk URL — elak tersimpan dalam history dan log.
- Halaman `noindex, nofollow`, dan **tiada dalam navbar**. Link dihantar Jim via WhatsApp.

## Ralat

Pages Function pulangkan `{ ok:false, code }`, bukan ayat — halaman ini dwibahasa, jadi teks
dipilih di browser ikut locale.

| Code | HTTP | Maksud |
|---|---|---|
| `bad_request` | 400 | Payload/action/type tak sah |
| `bad_phone` | 400 | Format phone salah |
| `bad_name` | 400 | Nama atau phone untuk dokumen kosong |
| `not_found` | 404 | Booking tiada, atau phone bukan pemilik |
| `not_available` | 409 | Jenis dokumen belum layak |
| `rate_limited` | 429 | Terlalu banyak percubaan |
| `unavailable` | 502 | Hermes/relay tak dapat dihubungi |

## Fail

| Fail | Peranan |
|---|---|
| `functions/api/documents.js` | Validate + proxy ke relay |
| `src/components/DocumentsPage.astro` | Borang, senarai booking, editor billing, semua JS |
| `src/components/DocumentSheet.astro` | Rangka dokumen + CSS print |
| `src/pages/documents.astro`, `src/pages/ms/documents.astro` | Route EN + BM |
| `src/lib/site.js` | `BANK` — butiran pembayaran pada dokumen |
| `docs/pricing.json` | `deposit.jumlah` — RM100 tetap |

## Artwork dokumen

Dokumen dilukis **atas artwork Canva pemilik** — bukan dibina semula dalam HTML.

| Fail | Guna |
|---|---|
| `public/images/doc-quotation.webp` | Latar quotation |
| `public/images/doc-invoice.webp` | Latar invois |
| `public/images/doc-receipt.webp` | Latar resit |

Sumber PNG asal (4066×5750, ~3.9 MB setiap satu) disimpan di `assets/doc-templates/` —
**di luar `public/`** supaya tak di-deploy. Versi webp 1240 lebar ≈ 110 KB.

Artwork sudah mengandungi **semua label tetap**: `Name:`, `Location :`, `Date :`, `Time :`,
tajuk kolum, wording PAYMENT TERMS (termasuk "Deposit: RM100"), butiran bank, dan footer.
Kod hanya letak **nilai** di atasnya.

### Kedudukan

Semua kedudukan ialah **peratus lebar/tinggi halaman**, diukur terhadap eksport 1240×1754.
Nisbah halaman dikunci pada A4 (`aspect-ratio: 1240/1754`), jadi ia tepat pada telefon,
desktop dan kertas.

Saiz font guna `--u` (1% lebar halaman) yang ditetapkan JS, **bukan `cqw`** — pipeline CSS Astro
menggugurkan unit `cqw` daripada inline style, dan teks jatuh senyap ke saiz body.

`line-height` juga dikunci dalam `--u`. Tanpa itu, nama panjang yang dikecilkan oleh
`shrinkToFit()` akan naik ke atas dan tak sejajar dengan labelnya.

**Kalau artwork di-eksport semula, ukur semula koordinat.**

### Had ruang

Artwork ada **satu baris item** dan tiada ruang phone/emel. Jadi:

- Caj perjalanan digabung ke dalam lajur Amount, dan ditulis sebagai baris nota di ruang kosong
  bawah `Time :` supaya jumlahnya kelihatan munasabah
- `billing.phone` dan `billing.email` diletak sebagai baris tambahan dalam kotak Company Address
- Nama terlalu panjang dikecilkan automatik sehingga 50% saiz asal

## Print

Butang "Print / Save as PDF" panggil `window.print()`. CSS print sembunyikan semua kecuali
`#doc-sheet`, dan `@page` ditetapkan A4 tanpa margin (artwork sudah ada margin sendiri).

**Peraturan penting:** selektor print mesti guna `:global()`. Nilai dokumen ditulis oleh
JavaScript pada runtime, jadi ia tiada atribut skop Astro — selektor berskop akan
menyembunyikannya dan mencetak template kosong.
