// POST /api/booking — validate, send Telegram notification, return { ok }
// Spec: docs/booking-spec.md. Secrets via Cloudflare env vars (never committed).
import pricing from '../../docs/pricing.json';

function bad(error, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

// Reject non-POST methods instead of falling through to static assets
export function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

// Resolve package + duration + price from pakej id and (for "basic") durasi id.
function resolvePackage(pakejId, durasiId) {
  const pakej = pricing.pakej.find((p) => p.id === pakejId);
  if (!pakej) return null;

  if (pakej.durasi_tetap) {
    return { nama: pakej.nama, durasi: pakej.durasi_tetap, harga: pakej.harga };
  }

  const durasi = pakej.durasi?.find((d) => d.id === durasiId);
  if (!durasi) return null;
  return { nama: pakej.nama, durasi: durasi.durasi, harga: durasi.harga };
}

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return bad('Payload bukan JSON');
  }

  // Honeypot filled → bot. Reject silently (pretend success).
  if (data.website) return Response.json({ ok: true });

  for (const field of ['nama', 'phone', 'tarikh', 'masa', 'pakej', 'lokasi']) {
    if (!data[field] || typeof data[field] !== 'string' || !data[field].trim()) {
      return bad(`Field wajib tiada: ${field}`);
    }
  }

  const phone = data.phone.replace(/[\s-]/g, '');
  if (!/^01[0-9]{8,9}$/.test(phone)) return bad('Format no. telefon tak sah');

  const pakejDef = pricing.pakej.find((p) => p.id === data.pakej);
  if (!pakejDef) return bad('Pakej tak sah');
  if (!pakejDef.durasi_tetap && !data.durasi) return bad('Field wajib tiada: durasi');

  const resolved = resolvePackage(data.pakej, data.durasi);
  if (!resolved) return bad('Pakej/durasi tak sah');

  // Date must be >= today + 2 (Malaysia time, UTC+8)
  const minDate = new Date(Date.now() + 8 * 3600 * 1000);
  minDate.setUTCDate(minDate.getUTCDate() + 2);
  const minStr = minDate.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tarikh) || data.tarikh < minStr) {
    return bad('Tarikh mesti sekurang-kurangnya 2 hari dari sekarang');
  }

  const priceLabel = resolved.harga === null ? 'Harga kena bincang' : `${pricing.currency}${resolved.harga}`;
  const [y, m, d] = data.tarikh.split('-');
  const lines = [
    '🎈 BOOKING BARU: badutmurah.my',
    '',
    `🤡 Badut: Jim The Clown`,
    `📅 ${d}/${m}/${y}, ${data.masa.trim()}`,
    `📦 ${resolved.nama} ${resolved.durasi} (${priceLabel})`,
    `📍 ${data.lokasi.trim()}`,
    `👤 ${data.nama.trim()} - ${phone}`,
  ];
  if (data.nota && data.nota.trim()) lines.push('', data.nota.trim());
  lines.push('', `Reply customer: wa.me/6${phone}`);

  const res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n') }),
  });

  if (!res.ok) return bad('Notifikasi gagal dihantar', 502);
  return Response.json({ ok: true });
}
