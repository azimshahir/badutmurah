// POST /api/gallery/publish — admin-only: mark a stored social image as
// published (shown in the public gallery) or unpublish it.
//
// Auth: Bearer token in `Authorization` header against MEDIA_UPLOAD_TOKEN.
// Body: { filename: "abc.jpg", published: true|false, gallery_month: "2026-08" }
//
// Returns the updated metadata. The file itself is never deleted here — a
// published image that is later unpublished stays on /media/social/<name> so
// any Buffer / social post referencing it keeps working.

function bad(message, status = 400) {
  return Response.json({ ok: false, error: message }, { status });
}

function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false;
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

export async function onRequestPost({ request, env }) {
  // ---- auth ----
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = env.MEDIA_UPLOAD_TOKEN || '';
  if (!token || !expected || !timingSafeEqual(token, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ---- body ----
  let body;
  try {
    body = await request.json();
  } catch {
    return bad('bad_request');
  }
  const filename = String(body.filename || '').trim();
  const published = body.published === true;
  const requestedMonth = String(body.gallery_month || '').trim();
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(filename)) {
    return bad('invalid_filename');
  }
  if (published && !/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth)) {
    return bad('invalid_gallery_month');
  }

  // File must exist
  const file = await env.MEDIA_KV.get(`social/${filename}`, 'arrayBuffer');
  if (file === null) {
    return bad('file_not_found', 404);
  }

  // Update metadata (keep created_at if present)
  let meta = { published, created_at: new Date().toISOString(), gallery_month: requestedMonth || null };
  try {
    const existing = JSON.parse(await env.MEDIA_KV.get(`meta/${filename}`));
    if (existing && existing.created_at) meta.created_at = existing.created_at;
    if (!requestedMonth && existing && existing.gallery_month) meta.gallery_month = existing.gallery_month;
  } catch {
    /* first publish — no existing meta */
  }
  await env.MEDIA_KV.put(`meta/${filename}`, JSON.stringify(meta), {
    metadata: { contentType: 'application/json' },
  });

  return Response.json({
    ok: true,
    filename,
    published,
    gallery_month: meta.gallery_month,
    url: `https://badutmurah.my/media/social/${filename}`,
  });
}
