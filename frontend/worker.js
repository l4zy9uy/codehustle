/**
 * Cloudflare Worker to serve static files from R2 with SPA routing support
 * Routes:
 * - /api/* -> Proxy to backend API
 * - Everything else -> Serve from R2, fallback to index.html for SPA routing
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Proxy API requests to backend (preserve the full /api path)
    if (path.startsWith('/api')) {
      const backendUrl = env.BACKEND_URL || 'http://backend:8081';
      const backendRequest = new Request(`${backendUrl}${url.pathname}${url.search}`, request);
      return fetch(backendRequest);
    }

    // Serve static files from R2
    let objectKey = path === '/' ? 'index.html' : path.slice(1);
    
    // Try to get the file from R2
    let object = await env.R2_BUCKET.get(objectKey);
    
    // If file doesn't exist and it's not a root path, try index.html (SPA routing)
    if (!object && path !== '/' && !path.includes('.')) {
      object = await env.R2_BUCKET.get('index.html');
    }
    
    // If still no object, return 404
    if (!object) {
      return new Response('Not Found', { status: 404 });
    }

    // Get the object body and headers
    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set('etag', object.httpEtag);

    // Set appropriate content type
    if (!headers.has('content-type')) {
      if (objectKey.endsWith('.html')) {
        headers.set('content-type', 'text/html; charset=utf-8');
      } else if (objectKey.endsWith('.js')) {
        headers.set('content-type', 'application/javascript; charset=utf-8');
      } else if (objectKey.endsWith('.css')) {
        headers.set('content-type', 'text/css; charset=utf-8');
      } else if (objectKey.endsWith('.json')) {
        headers.set('content-type', 'application/json');
      }
    }

    // Cache static assets
    if (objectKey.match(/\.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$/)) {
      headers.set('Cache-Control', 'public, max-age=31536000, immutable');
    } else {
      headers.set('Cache-Control', 'public, max-age=0, must-revalidate');
    }

    return new Response(object.body, { headers });
  },
};
