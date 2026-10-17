export default {
  async fetch(request) {
    const url = new URL(request.url);

    // Raw access for Petals
    if (url.pathname.startsWith('/repository/raw/')) {
      const ghPath = url.pathname.replace('/repository/raw', '');
      const resp = await fetch(
        'https://raw.githubusercontent.com/kosakovitch-2013/Petals/main' + ghPath
      );
      return new Response(resp.body, {
        headers: { 'Content-Type': 'application/octet-stream' },
      });
    }

    // Everything else → serve the HTML
    return new Response(`<!doctype html>
<html>
<head>...</head>
<body>
  <h1>Petals Repository</h1>
  <script>...</script>
</body>
</html>`, {
      headers: { 'Content-Type': 'text/html' },
    });
  },
};
