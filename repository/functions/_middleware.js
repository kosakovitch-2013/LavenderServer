export async function onRequest(context) {
  const url = new URL(context.request.url);

  // /repository/raw/* → proxy to GitHub
  if (url.pathname.startsWith('/repository/raw/')) {
    const ghPath = url.pathname.replace('/repository/raw', '');
    return proxyToGitHub(ghPath);
  }

  // /repository/PETALINDEX or /repository/dynamic/* (machine clients)
  const ua = context.request.headers.get('User-Agent') || '';
  const isMachine = /wget|curl|petals/i.test(ua);
  if (
    isMachine &&
    (url.pathname === '/repository/PETALINDEX' ||
      url.pathname.startsWith('/repository/dynamic/') ||
      url.pathname.startsWith('/repository/meta/'))
  ) {
    return proxyToGitHub(url.pathname.replace('/repository', ''));
  }

  // Everything else → static files (index.html, etc.)
  return context.next();
}

async function proxyToGitHub(ghPath) {
  const ghUrl =
    'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main' + ghPath;
  const resp = await fetch(ghUrl);
  return new Response(resp.body, {
    status: resp.status,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
