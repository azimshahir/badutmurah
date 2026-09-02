// POST /api/upload-media — admin-only media upload for social publishing.
//
// Auth: Bearer token in `Authorization` header, compared constant-time against
// the MEDIA_UPLOAD_TOKEN secret (set in Cloudflare dashboard / API).
//
// Behaviour:
//  - Accepts image/jpeg, image/png, image/webp and video/mp4 (header check).
//  - Validates the real file format via magic bytes (not just the header).
//  - Strips EXIF/GPS metadata chunks from the bytes (JPEG APP1/APP13, PNG
//    eXIf, WebP EXIF) — no external image library needed, so this works in
//    the Pages Functions runtime.
//  - Generates a unique, non-overwriting filename (timestamp + random + ext).
//  - Stores bytes in MEDIA_KV under `social/<name>` + metadata under
//    `meta/<name>` with { published: false }.
//    Social-uploaded files do NOT appear in the public gallery until marked
//    published via the admin publish endpoint.
//  - Returns the stable public URL https://badutmurah.my/media/social/<name>.
//
// Limits: 10 MiB per image and 20 MiB per MP4 (below the KV value limit).

const ALLOWED = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'video/mp4': 'mp4',
};

const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const MAX_VIDEO_BYTES = 20 * 1024 * 1024;

export function onRequestGet() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'POST' } });
}

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

// ---- format detection from magic bytes ----
export function detectFormat(bytes) {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
    bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a
  ) {
    return 'image/png';
  }
  if (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  ) {
    return 'image/webp';
  }
  // ISO Base Media File Format. Require an MP4-compatible major brand and
  // reject QuickTime's `qt  ` brand so a renamed MOV is not accepted.
  if (
    bytes.length >= 12 &&
    bytes[4] === 0x66 && bytes[5] === 0x74 && bytes[6] === 0x79 && bytes[7] === 0x70
  ) {
    const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
    const mp4Brands = new Set(['isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42', 'avc1', 'M4V ']);
    if (mp4Brands.has(brand)) return 'video/mp4';
  }
  return null;
}

// ---- EXIF/GPS stripping ----
function bytesToU8(data) {
  return data instanceof Uint8Array ? data : new Uint8Array(data);
}

// JPEG: walk segments, drop APP1 (EXIF/XMP) + APP13 (Photoshop/IPTC).
// Keeps everything else (APP0 JFIF, APP14 Adobe, etc.) so colours stay intact.
function stripJpegExif(data) {
  const src = bytesToU8(data);
  if (src.length < 4 || src[0] !== 0xff || src[1] !== 0xd8) return src;
  const out = [0xff, 0xd8]; // SOI
  let i = 2;
  while (i + 1 < src.length) {
    if (src[i] !== 0xff) break; // safety
    const marker = src[i + 1];
    if (marker === 0xda) {
      // SOS — rest is entropy-coded data; copy to end and stop.
      out.push(src[i], src[i + 1]);
      for (let j = i + 2; j < src.length; j++) out.push(src[j]);
      return new Uint8Array(out);
    }
    if (marker === 0xd9) {
      // EOI
      out.push(src[i], src[i + 1]);
      return new Uint8Array(out);
    }
    if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) {
      // Standalone markers (TEM, RSTn) — no length field.
      out.push(src[i], src[i + 1]);
      i += 2;
      continue;
    }
    if (i + 3 >= src.length) break;
    const segLen = (src[i + 2] << 8) | src[i + 3];
    const end = i + 2 + segLen;
    if (end > src.length) break;
    // Drop EXIF (APP1) and Photoshop (APP13) segments.
    const drop = marker === 0xe1 || marker === 0xed;
    if (!drop) {
      for (let j = i; j < end; j++) out.push(src[j]);
    }
    i = end;
  }
  return new Uint8Array(out);
}

// PNG: drop eXIf chunk (and other metadata text chunks for cleanliness).
function stripPngExif(data) {
  const src = bytesToU8(data);
  if (src.length < 8) return src;
  const out = [];
  for (let j = 0; j < 8; j++) out.push(src[j]); // signature
  let i = 8;
  while (i + 8 <= src.length) {
    const len = ((src[i] << 24) | (src[i + 1] << 16) | (src[i + 2] << 8) | src[i + 3]) >>> 0;
    const type = String.fromCharCode(src[i + 4], src[i + 5], src[i + 6], src[i + 7]);
    const total = 8 + len + 4; // type + data + CRC
    if (i + total > src.length) break;
    const drop = type === 'eXIf' || type === 'tEXt' || type === 'zTXt' || type === 'iTXt';
    if (!drop) {
      for (let j = i; j < i + total; j++) out.push(src[j]);
    }
    i += total;
  }
  return new Uint8Array(out);
}

// WebP: drop EXIF / XMP chunks (RIFF chunks: 4-byte type + 4-byte size + data).
function stripWebpExif(data) {
  const src = bytesToU8(data);
  if (src.length < 12) return src;
  const out = [];
  for (let j = 0; j < 12; j++) out.push(src[j]); // RIFF header + WEBP
  let i = 12;
  while (i + 8 <= src.length) {
    const type = String.fromCharCode(src[i], src[i + 1], src[i + 2], src[i + 3]);
    // WebP chunk sizes are little-endian.
    const size = (src[i + 4] | (src[i + 5] << 8) | (src[i + 6] << 16) | (src[i + 7] << 24)) >>> 0;
    const chunkTotal = 8 + size + (size & 1); // chunks are 2-byte aligned
    if (i + 8 + size > src.length) break;
    const drop = type === 'EXIF' || type === 'XMP ';
    if (!drop) {
      for (let j = i; j < i + chunkTotal && j < src.length; j++) out.push(src[j]);
    }
    i += chunkTotal;
  }
  return new Uint8Array(out);
}

function stripExif(bytes, format) {
  if (format === 'image/jpeg') return stripJpegExif(bytes);
  if (format === 'image/png') return stripPngExif(bytes);
  if (format === 'image/webp') return stripWebpExif(bytes);
  return bytes;
}

export { stripJpegExif, stripPngExif, stripWebpExif, stripExif };

export async function onRequestPost({ request, env }) {
  // ---- auth ----
  const header = request.headers.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const expected = env.MEDIA_UPLOAD_TOKEN || '';
  if (!token || !expected || !timingSafeEqual(token, expected)) {
    return new Response('Unauthorized', { status: 401 });
  }

  // ---- content-type header check ----
  const contentType = (request.headers.get('Content-Type') || '').split(';')[0].trim().toLowerCase();
  if (!ALLOWED[contentType]) {
    return bad(`unsupported content type: ${contentType || '(none)'}. Allowed: image/jpeg, image/png, image/webp, video/mp4`);
  }
  const maxBytes = contentType === 'video/mp4' ? MAX_VIDEO_BYTES : MAX_IMAGE_BYTES;
  const length = Number(request.headers.get('Content-Length') || '0');
  if (length > maxBytes) return bad(`file too large (max ${maxBytes / 1024 / 1024} MiB)`, 413);

  // ---- read body ----
  let buf;
  try {
    buf = await request.arrayBuffer();
  } catch {
    return bad('could not read body');
  }
  const bytes = new Uint8Array(buf);
  if (bytes.byteLength === 0) return bad('empty file');
  if (bytes.byteLength > maxBytes) return bad(`file too large (max ${maxBytes / 1024 / 1024} MiB)`, 413);

  // ---- validate real format (magic bytes) ----
  const realType = detectFormat(bytes);
  if (!realType) return bad('invalid media: not a JPEG, PNG, WebP or supported MP4 file');
  if (realType !== contentType) {
    return bad(`content-type (${contentType}) does not match file format (${realType})`);
  }

  // ---- strip EXIF / GPS ----
  const cleaned = stripExif(bytes, realType);
  if (cleaned.byteLength === 0) return bad('image processing failed');

  // ---- unique filename (never overwrites) ----
  const ext = ALLOWED[realType];
  const stamp = Date.now().toString(36);
  const rand = Math.random().toString(36).slice(2, 10);
  const name = `${stamp}-${rand}.${ext}`;

  // ---- store ----
  try {
    await env.MEDIA_KV.put(`social/${name}`, cleaned, {
      metadata: { contentType: realType },
    });
    await env.MEDIA_KV.put(`meta/${name}`, JSON.stringify({ published: false, created_at: new Date().toISOString() }), {
      metadata: { contentType: 'application/json' },
    });
  } catch (err) {
    return bad(`storage failed: ${err?.message || 'unknown error'}`, 500);
  }

  return Response.json({
    ok: true,
    filename: name,
    url: `https://badutmurah.my/media/social/${name}`,
    content_type: realType,
    size: cleaned.byteLength,
    published: false,
    note: 'File is stored for social publishing and is NOT shown in the public gallery.',
  });
}
