const test = require('node:test');
const assert = require('node:assert');
const http = require('node:http');
const { handler } = require('../src/server');

function get(server, path) {
  const { port } = server.address();
  return new Promise((resolve, reject) => {
    http.get(`http://127.0.0.1:${port}${path}`, (res) => {
      let body = '';
      res.on('data', (c) => (body += c));
      res.on('end', () => resolve({ status: res.statusCode, body }));
    }).on('error', reject);
  });
}

test('server answers /health and greetings', async (t) => {
  const server = http.createServer(handler).listen(0);
  t.after(() => server.close());
  await new Promise((r) => server.once('listening', r));

  const health = await get(server, '/health');
  assert.strictEqual(health.status, 200);
  assert.deepStrictEqual(JSON.parse(health.body), { status: 'ok' });

  const hello = await get(server, '/?name=Wendt');
  assert.strictEqual(hello.body, 'Hello, Wendt!\n');
});
