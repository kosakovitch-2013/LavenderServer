const PETALS_RAW = 'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main';

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    // 1. Raw proxy: /raw/* or /repository/raw/*
    if (path.startsWith('/raw/') || path.startsWith('/repository/raw/')) {
      const ghPath = path.replace('/repository', '').replace('/raw', '');
      return proxyToGitHub(ghPath);
    }

    // 2. Machine clients hitting raw paths
    const ua = request.headers.get('User-Agent') || '';
    const isMachine = /wget|curl|petals/i.test(ua);
    if (isMachine) {
      const stripped = path.replace('/repository', '');
      if (stripped === '/PETALINDEX' ||
          stripped.startsWith('/dynamic/') ||
          stripped.startsWith('/meta/')) {
        return proxyToGitHub(stripped);
      }
    }

    // 3. Everything else → assets
    // /             → index.html           (main site)
    // /repository/  → repository/index.html (browse UI)
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
