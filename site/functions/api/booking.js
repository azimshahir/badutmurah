// POST /api/booking — validate, forward lead to jim-relay (VPS YAML + watcher notification), return { ok }
// Spec: docs/booking-spec.md. Secrets via Cloudflare env vars (never committed).
import pricing from '../../docs/pricing.json';

function bad(error, status = 400) {
  return Response.json({ ok: false, error }, { status });
}

// Reject non-POST methods instead of falling through to static assets
export function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

// Collapse line breaks and cap length so remote error text is safe to log.
function sanitizeDiag(text) {
  if (typeof text !== 'string' || !text.trim()) return '';
  return text.replace(/\s*[\r\n]+\s*/g, ' ').trim().slice(0, 160);
}

// Extract sanitized diagnostic text from a non-2xx response body: prefers the
// named JSON field, falls back to the raw body when absent or not JSON.
async function diagFromJson(res, field) {
  let text;
  try {
    text = await res.text();
  } catch {
    return '';
  }
  try {
    const value = JSON.parse(text)?.[field];
    return typeof value === 'string' && value.trim() ? sanitizeDiag(value) : sanitizeDiag(text);
  } catch {
    return sanitizeDiag(text);
  }
}

// Sanitized "type=…; server=…; cf-ray=…" suffix from response headers — helps
// tell whether a request reached the origin app or was intercepted upstream
// (e.g. by Cloudflare). Never includes request headers or secrets.
function describeHeaders(res) {
  const type = sanitizeDiag(res.headers.get('content-type') || '');
  const server = sanitizeDiag(res.headers.get('server') || '');
  const ray = sanitizeDiag(res.headers.get('cf-ray') || '');
  return (
    (type ? `; type=${type}` : '') +
    (server ? `; server=${server}` : '') +
    (ray ? `; cf-ray=${ray}` : '')
  );
}

// Forward the validated lead to the jim-relay Worker (feeds the VPS YAML +
// Linux watcher pipeline). Awaited: the booking now succeeds only if this is
// accepted. Failures are logged (never the secret or full payload) and the
// raw error is never returned to the customer — returns true/false only.
async function forwardToVps(env, payload) {
  if (!env.WEBSITE_WEBHOOK_SECRET) {
    console.error('website-lead forward skipped: WEBSITE_WEBHOOK_SECRET not set');
    return false;
  }
  try {
    const res = await env.RELAY.fetch('https://jim-relay/api/website-lead', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBSITE_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) {
      const detail = await diagFromJson(res, 'error');
      console.error(`website-lead forward failed: HTTP ${res.status}${detail ? `; ${detail}` : ''}${describeHeaders(res)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error(`website-lead forward failed: ${err?.name || 'unknown error'}`);
    return false;
  }
}

// Promo price for a package on a given date, or null when the promo doesn't apply.
// Re-derived here from pricing.json — the price shown by the browser is never trusted.
function promoHarga(pakejId, durasiId, tarikh) {
  const promo = pricing.promo;
  if (!promo?.aktif) return null;
  // `bulan` covers a promo that may span several months — accept a single
  // string too so an older pricing.json shape still works.
  const bulanList = Array.isArray(promo.bulan) ? promo.bulan : [promo.bulan];
  if (!bulanList.some((b) => tarikh.startsWith(b))) return null;
  const entry = promo.harga?.[pakejId];
  if (entry == null) return null;
  return typeof entry === 'number' ? entry : (entry[durasiId] ?? null);
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

  let prize = null;
  if (pakejDef.prize_options) {
    if (typeof data.prize !== 'string' || !data.prize.trim()) return bad('Field wajib tiada: prize');
    if (!pakejDef.prize_options.map(String).includes(data.prize)) return bad('Prize tak sah');
    prize = Number(data.prize);
  }

  const resolved = resolvePackage(data.pakej, data.durasi);
  if (!resolved) return bad('Pakej/durasi tak sah');

  // Date must be >= today + 2 (Malaysia time, UTC+8)
  const minDate = new Date(Date.now() + 8 * 3600 * 1000);
  minDate.setUTCDate(minDate.getUTCDate() + 2);
  const minStr = minDate.toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.tarikh) || data.tarikh < minStr) {
    return bad('Tarikh mesti sekurang-kurangnya 2 hari dari sekarang');
  }

  // Apply the promo only after the date passed validation above, so the price
  // can never be driven by a malformed date. Payload shape is unchanged — `harga`
  // simply carries the promo price when the event falls in the promo month.
  const harga = promoHarga(data.pakej, data.durasi, data.tarikh) ?? resolved.harga;

  // Keep the explicit field for relay support and mirror it into notes so the
  // current notification pipeline still shows the selection.
  const nota = data.nota?.trim() ?? '';
  const relayNota = prize === null ? nota : `${nota}${nota ? '\n\n' : ''}Prize: RM${prize}`;

  // Booking succeeds only once jim-relay accepts the lead — it feeds the VPS
  // YAML + Linux watcher pipeline that sends the single owner notification.
  const relayOk = await forwardToVps(env, {
    nama: data.nama.trim(),
    phone,
    tarikh: data.tarikh,
    masa: data.masa.trim(),
    pakej: data.pakej,
    durasi: pakejDef.durasi_tetap ? null : data.durasi,
    ...(prize === null ? {} : { prize }),
    lokasi: data.lokasi.trim(),
    nota: relayNota,
    harga,
    website: '',
  });

  if (!relayOk) return bad('Notifikasi gagal dihantar', 502);
  return Response.json({ ok: true });
}
