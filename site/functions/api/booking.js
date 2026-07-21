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

// TEMPORARY DIAGNOSTIC — checks whether a plain unauthenticated GET from this
// Pages Function even reaches bot.badutmurah.my, to isolate whether the
// POST /website-lead failure is a blanket block on Workers fetches to this
// host, or specific to that request. Remove once root cause is confirmed.
async function probeVpsHealth() {
  try {
    const res = await fetch('https://bot.badutmurah.my/health', {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });
    const body = await diagFromJson(res, 'status');
    console.log(`vps health probe: HTTP ${res.status}${body ? `; body=${body}` : ''}${describeHeaders(res)}`);
  } catch (err) {
    console.error(`vps health probe failed: ${err?.name || 'unknown error'}`);
  }
}

// Forward the validated lead to the Jim Bot VPS. Runs via waitUntil after the
// response is sent: failures are logged (never the secret or full payload) and
// must never affect the customer-facing result.
async function forwardToVps(env, payload) {
  if (!env.WEBSITE_WEBHOOK_SECRET) {
    console.error('website-lead forward skipped: WEBSITE_WEBHOOK_SECRET not set');
    return;
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
    }
  } catch (err) {
    console.error(`website-lead forward failed: ${err?.name || 'unknown error'}`);
  }
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

export async function onRequestPost(context) {
  const { request, env } = context;
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

  // Fire-and-forget lead forward to the VPS bot; only Telegram below decides
  // the HTTP response, so VPS latency/failure is invisible to the customer.
  // Diagnostic health probe runs first (temporary — see probeVpsHealth).
  context.waitUntil(
    (async () => {
      await forwardToVps(env, {
        nama: data.nama.trim(),
        phone,
        tarikh: data.tarikh,
        masa: data.masa.trim(),
        pakej: data.pakej,
        durasi: data.durasi ?? null,
        lokasi: data.lokasi.trim(),
        nota: data.nota?.trim() ?? '',
        harga: resolved.harga,
        website: '',
      });
    })()
  );

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

  let res;
  try {
    res = await fetch(`https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: env.TELEGRAM_CHAT_ID, text: lines.join('\n') }),
    });
  } catch (err) {
    console.error(`telegram notification failed: ${err?.name || 'unknown error'}`);
    return bad('Notifikasi gagal dihantar', 502);
  }

  if (!res.ok) {
    const detail = await diagFromJson(res, 'description');
    console.error(`telegram notification failed: HTTP ${res.status}${detail ? `; ${detail}` : ''}`);
    return bad('Notifikasi gagal dihantar', 502);
  }
  return Response.json({ ok: true });
}
