const http = require('node:http');
const { greet } = require('./greet');

const PORT = process.env.PORT || 3000;

function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok' }));
  }

  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end(greet(url.searchParams.get('name')) + '\n');
}

if (require.main === module) {
  http.createServer(handler).listen(PORT, () => {
    console.log(`Listening on http://localhost:${PORT}`);
  });
}

module.exports = { handler };
