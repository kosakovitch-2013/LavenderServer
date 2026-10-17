export async function onRequest(context) {
  const url = new URL(context.request.url);
  let path = url.pathname;

  // Strip /repository prefix if present
  if (path.startsWith('/repository')) {
    path = path.replace('/repository', '') || '/';
  }

  // Raw proxy: /raw/*  or  /PETALINDEX  or  /dynamic/*  or  /meta/*
  if (path.startsWith('/raw/')) {
    const ghPath = path.replace('/raw', '');
    return proxyToGitHub(ghPath);
  }

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

  // Humans → serve static files from repository/
  // Rewrite /repository/* to /* so Pages finds the right file
  if (url.pathname.startsWith('/repository/')) {
    const newUrl = new URL(context.request.url);
    newUrl.pathname = url.pathname.replace('/repository', '');
    return context.env.ASSETS
      ? context.env.ASSETS.fetch(newUrl)
      : context.next();
  }

  return context.next();
}

async function proxyToGitHub(ghPath) {
  // Proxies to the Petals package repo
  const ghUrl =
    'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main' + ghPath;
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
