const PETALS_RAW = 'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    let path = url.pathname;

    // /raw/* or /repository/raw/* → proxy to GitHub
    if (path.startsWith('/raw/') || path.startsWith('/repository/raw/')) {
      const ghPath = path.replace('/repository', '').replace('/raw', '');
      return proxyToGitHub(ghPath);
    }

    // Machine clients
    const ua = request.headers.get('User-Agent') || '';
    const isMachine = /wget|curl|petals/i.test(ua);
    if (isMachine && (path === '/PETALINDEX' || path === '/repository/PETALINDEX' || path.startsWith('/dynamic/') || path.startsWith('/meta/'))) {
      return proxyToGitHub(path.replace('/repository', ''));
    }

    // /repository/* → serve repository/index.html via assets
    if (path.startsWith('/repository')) {
      const assetUrl = new URL(request.url);
      assetUrl.pathname = path.replace('/repository', '') || '/';
      return env.ASSETS.fetch(assetUrl);
    }

    // Everything else → serve from assets (repo root)
    return env.ASSETS.fetch(request);
  },
};

async function proxyToGitHub(ghPath) {
  const resp = await fetch(PETALS_RAW + ghPath);
  return new Response(resp.body, {
    status: resp.status,
    headers: {
      'Content-Type': resp.headers.get('Content-Type') || 'application/octet-stream',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
