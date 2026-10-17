import html from './index.html';

export default {
  async fetch(request) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Only handle /repository
    if (!path.startsWith('/repository')) {
      return new Response('Not Found', { status: 404 });
    }

    let sub = path.replace('/repository', '') || '/';
    if (sub === '') sub = '/';

    // /repository/raw/* → proxy to GitHub
    if (sub.startsWith('/raw/')) {
      const ghPath = sub.replace('/raw', '');
      return proxyToGitHub(ghPath);
    }

    // Machine clients (wget/curl) → raw
    const ua = request.headers.get('User-Agent') || '';
    const isMachine = /wget|curl|petals/i.test(ua);
    if (isMachine && (sub === '/PETALINDEX' || sub.startsWith('/dynamic/') || sub.startsWith('/meta/'))) {
      return proxyToGitHub(sub);
    }

    // Humans → HTML browse
    return new Response(html, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  },
};

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
