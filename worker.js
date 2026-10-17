const PETALS_RAW = 'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    let path = url.pathname;

    if (path.startsWith('/repository')) {
      path = path.replace('/repository', '') || '/';
    }

    // /raw/* → proxy to GitHub
    if (path.startsWith('/raw/')) {
      const ghPath = path.replace('/raw', '');
      return proxyToGitHub(ghPath);
    }

    // Machine clients hitting raw paths
    const ua = request.headers.get('User-Agent') || '';
    const isMachine = /wget|curl|petals/i.test(ua);
    if (isMachine && (path === '/PETALINDEX' || path.startsWith('/dynamic/') || path.startsWith('/meta/'))) {
      return proxyToGitHub(path);
    }

    // Everything else → serve static files (Pages-like behavior)
    // Cloudflare Workers with assets use env.ASSETS
    if (typeof env !== 'undefined' && env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};

async function proxyToGitHub(ghPath) {
  const ghUrl = PETALS_RAW + ghPath;
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
