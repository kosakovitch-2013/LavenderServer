export async function onRequest(context) {
  const url = new URL(context.request.url);
  let path = url.pathname;

  if (path.startsWith('/repository')) {
    path = path.replace('/repository', '') || '/';
  }

  if (path.startsWith('/raw/')) {
    const ghPath = path.replace('/raw', '');
    return proxyToGitHub(ghPath);
  }

  const ua = context.request.headers.get('User-Agent') || '';
  const isMachine = /wget|curl|petals/i.test(ua);
  if (isMachine && (path === '/PETALINDEX' || path.startsWith('/dynamic/') || path.startsWith('/meta/'))) {
    return proxyToGitHub(path);
  }

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
