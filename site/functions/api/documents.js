// POST /api/documents — look up a customer's bookings by phone, then issue a
// quotation/invoice/receipt. All data lives in Hermes on the VPS; this function
// only validates and proxies through the jim-relay service binding.
// Spec: docs/documents-spec.md. Secrets via Cloudflare env vars (never committed).

const TYPES = ['quotation', 'invoice', 'receipt'];

// `code` lets the browser pick a message in the visitor's language — the page is
// bilingual, so a fixed string here would show up in the wrong one.
function bad(code, status = 400) {
  return Response.json({ ok: false, code }, { status });
}

// Reject non-POST methods instead of falling through to static assets
export function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

// Trim a customer-supplied string to a sane length, or null when empty.
function field(value, max) {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed ? trimmed.slice(0, max) : null;
}

// Call jim-relay. Returns { status, data } — never throws into the response path.
async function callRelay(env, path, payload) {
  if (!env.WEBSITE_WEBHOOK_SECRET) {
    console.error(`${path} skipped: WEBSITE_WEBHOOK_SECRET not set`);
    return { status: 0, data: null };
  }
  try {
    const res = await env.RELAY.fetch(`https://jim-relay${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBSITE_WEBHOOK_SECRET,
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(8000),
    });
    const text = await res.text();
    if (!res.ok) {
      // Log status only — the body can carry customer data.
      console.error(`${path} failed: HTTP ${res.status}`);
      return { status: res.status, data: null };
    }
    try {
      return { status: res.status, data: JSON.parse(text) };
    } catch {
      console.error(`${path} failed: response was not JSON`);
      return { status: 502, data: null };
    }
  } catch (err) {
    console.error(`${path} failed: ${err?.name || 'unknown error'}`);
    return { status: 0, data: null };
  }
}

export async function onRequestPost({ request, env }) {
  let body;
  try {
    body = await request.json();
  } catch {
    return bad('bad_request');
  }

  // Honeypot filled → bot. Reject silently (pretend empty result).
  if (body.website) return Response.json({ ok: true, bookings: [] });

  if (typeof body.phone !== 'string') return bad('bad_phone');
  const phone = body.phone.replace(/[\s-]/g, '');
  if (!/^01[0-9]{8,9}$/.test(phone)) return bad('bad_phone');

  // ---- action: list — which bookings belong to this phone ----
  if (body.action === 'list') {
    const { status, data } = await callRelay(env, '/api/document-list', { phone });
    if (status === 429) return bad('rate_limited', 429);
    if (!data) return bad('unavailable', 502);
    return Response.json({ ok: true, bookings: data.bookings ?? [] });
  }

  // ---- action: issue — generate one document ----
  if (body.action === 'issue') {
    const leadId = field(body.lead_id, 100);
    if (!leadId) return bad('bad_request');
    if (!TYPES.includes(body.type)) return bad('bad_request');

    const b = body.billing ?? {};
    const billing = {
      nama: field(b.nama, 120),
      alamat: field(b.alamat, 300),
      phone: field(b.phone, 30),
      email: field(b.email, 120),
    };
    if (!billing.nama) return bad('bad_name');
    if (!billing.phone) return bad('bad_name');

    const { status, data } = await callRelay(env, '/api/document-issue', {
      phone,
      lead_id: leadId,
      type: body.type,
      billing,
    });

    // 404 covers both "no such booking" and "phone doesn't own it" — keep the
    // customer-facing wording identical so this can't be used to probe.
    if (status === 404) return bad('not_found', 404);
    if (status === 409) return bad('not_available', 409);
    if (status === 429) return bad('rate_limited', 429);
    if (!data) return bad('unavailable', 502);
    return Response.json({ ok: true, document: data });
  }

  return bad('bad_request');
}
