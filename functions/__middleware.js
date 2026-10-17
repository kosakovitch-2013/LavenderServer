// Cloudflare Pages middleware
// Proxies /repository/raw/* and machine requests to GitHub Petals repo.
// Static browse UI is served as-is from repository/index.html.

const PETALS_RAW = 'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main';

export async function onRequest(context) {
  const url = new URL(context.request.url);
  let path = url.pathname;

  // Strip optional /repository prefix
  if (path.startsWith('/repository')) {
    path = path.replace('/repository', '') || '/';
  }

  // 1. Explicit raw prefix: /repository/raw/* or /raw/*
  if (path.startsWith('/raw/')) {
    const ghPath = path.replace('/raw', '');
    return proxyToGitHub(ghPath);
  }

  // 2. Machine clients hitting raw paths directly (wget/curl/petals)
  const ua = context.request.headers.get('User-Agent') || '';
  const isMachine = /wget|curl|petals/i.test(ua);
  if (
    isMachine &&
    (path === '/PETALINDEX' ||
      path.startsWith('/dynamic/') ||
      path.startsWith('/meta/'))
  ) {
    return proxyToGitHub(path);
  }

  // 3. Everything else → let Pages serve static files
  return context.next();
}

async function proxyToGitHub(ghPath) {
  const ghUrl = PETALS_RAW + ghPath;
  const resp = await fetch(ghUrl);

  return new Response(resp.body, {
    status: resp.status,
    headers: {
      'Content-Type':
        resp.headers.get('Content-Type') || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
