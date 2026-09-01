// GET /api/gallery — list published gallery images only.
//
// Reads metadata records stored under `meta/<name>`; returns only entries with
// `published: true`. Social-uploaded files (published: false) never appear.
//
// Response: { ok: true, images: [{ name, url, created_at }] }

const LIST_LIMIT = 1000;

export async function onRequestGet({ env }) {
  try {
    const list = await env.MEDIA_KV.list({ prefix: 'meta/', limit: LIST_LIMIT });
    const images = [];
    for (const key of list.keys) {
      const name = key.name.slice('meta/'.length);
      if (!name) continue;
      let meta;
      try {
        meta = JSON.parse(await env.MEDIA_KV.get(`meta/${name}`));
      } catch {
        continue; // corrupt/missing metadata — skip
      }
      if (meta && meta.published === true) {
        images.push({
          name,
          url: `https://badutmurah.my/media/social/${name}`,
          created_at: meta.created_at || null,
        });
      }
    }
    images.sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
    return Response.json({ ok: true, images });
  } catch (err) {
    return Response.json({ ok: false, error: err?.message || 'unknown error' }, { status: 500 });
  }
}

export function onRequestPost() {
  return new Response('Method Not Allowed', { status: 405, headers: { Allow: 'GET' } });
}
