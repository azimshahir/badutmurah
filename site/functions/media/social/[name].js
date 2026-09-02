// GET /media/social/<filename> — serve a stored media file with the correct
// Content-Type. No auth on purpose: these URLs are hotlinked directly by
// social platforms (Buffer, TikTok, YouTube, IG) and must open without
// login, cookies or referer restrictions.
//
// Files live in the MEDIA_KV namespace under the `social/` prefix. The name
// is validated to a safe charset so a request can never escape the prefix.

const MIME = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  mp4: 'video/mp4',
};

export async function onRequestGet({ env, params }) {
  const name = String(params.name || '');
  if (!/^[a-zA-Z0-9][a-zA-Z0-9._-]*$/.test(name)) {
    return new Response('Not Found', { status: 404 });
  }
  const ext = name.split('.').pop().toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';

  const obj = await env.MEDIA_KV.get(`social/${name}`, 'arrayBuffer');
  if (obj === null) {
    return new Response('Not Found', { status: 404 });
  }

  return new Response(obj, {
    headers: {
      'Content-Type': type,
      'Content-Length': String(obj.byteLength),
      // Public + immutable: the filename is unique forever, so a long cache
      // makes Buffer / platform fetches fast and cheap.
      'Cache-Control': 'public, max-age=31536000, immutable',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
