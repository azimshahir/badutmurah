// Routes website requests to the VPS bot. Paths are matched explicitly so a
// request can never reach an endpoint it wasn't meant for.
const ROUTES = {
  '/api/website-lead': 'https://bot.badutmurah.my/api/website-lead',
  '/api/document-list': 'https://bot.badutmurah.my/api/document-list',
  '/api/document-issue': 'https://bot.badutmurah.my/api/document-issue',
};

export default {
  async fetch(request, env) {
    if (request.method !== 'POST') {
      return new Response('method not allowed', { status: 405 });
    }
    const secret = request.headers.get('X-Webhook-Secret');
    if (!secret || secret !== env.WEBSITE_WEBHOOK_SECRET) {
      return new Response('unauthorized', { status: 401 });
    }

    const target = ROUTES[new URL(request.url).pathname];
    if (!target) return new Response('not found', { status: 404 });

    const body = await request.text();
    const resp = await fetch(target, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': env.WEBSITE_WEBHOOK_SECRET,
      },
      body,
    });
    // Preserve status AND content type — the documents API needs the website to
    // tell 404 / 409 / 429 apart and parse JSON reliably.
    return new Response(await resp.text(), {
      status: resp.status,
      headers: { 'Content-Type': resp.headers.get('Content-Type') || 'application/json' },
    });
  },
};
