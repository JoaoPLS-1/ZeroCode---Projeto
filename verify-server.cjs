const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const { createSessions, SESSION_TTL } = require('./server/sessions.cjs');
const { BODY_LIMIT } = require('./server/router.cjs');

function request(port, pathname, { method = 'GET', cookie, body, chunked = false } = {}) {
  return new Promise((resolve, reject) => {
    const headers = {};
    if (cookie) headers.Cookie = cookie;
    if (body !== undefined) {
      headers['Content-Type'] = 'application/json';
      if (!chunked) headers['Content-Length'] = Buffer.byteLength(body);
    }
    const req = http.request({ host: '127.0.0.1', port, path: pathname, method, headers }, res => {
      const chunks = [];
      res.on('data', chunk => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: Buffer.concat(chunks).toString('utf8') }));
      res.on('error', reject);
    });
    req.on('error', reject);
    if (chunked && body) { req.write(body.slice(0, 100));req.write(body.slice(100));req.end(); }
    else req.end(body);
  });
}

function security(response) {
  assert.equal(response.headers['x-content-type-options'], 'nosniff');
  assert.equal(response.headers['referrer-policy'], 'no-referrer');
  assert.equal(response.headers['x-frame-options'], 'DENY');
  assert(response.headers['content-security-policy']);
}

async function verify() {
  let time = 1000;
  const sessions = createSessions({ now: () => time });
  const response = { setHeader(name, value) { this.cookie = value; } };
  const session = sessions.create(response), req = { headers: { cookie: response.cookie.split(';')[0] } };
  assert.equal(session.criadaEm, time);assert.deepEqual(session.progresso, []);
  session.progresso.push('teste');time++;sessions.reset(session);
  assert.deepEqual(session.progresso, []);assert.equal(session.criadaEm, time);
  time += SESSION_TTL - 1;assert.equal(sessions.get(req), session);
  time += SESSION_TTL - 1;assert.equal(sessions.get(req), session, 'Uso deve renovar a expiração');
  time += SESSION_TTL;assert.equal(sessions.get(req), null);
  assert.equal(sessions.get({ headers: { cookie: 'zc_sid=invalido' } }), null);
  const app = createApp();assert.equal(app.listening, false);
  await new Promise((resolve, reject) => { app.once('error', reject);app.listen(0, '127.0.0.1', resolve); });
  const port = app.address().port;
  try {
    const index = await request(port, '/');assert.equal(index.status, 200);security(index);
    assert(index.body.includes('engine/api.js'));assert(!index.body.includes('onclick='));
    for (const directive of ["script-src 'self'", "worker-src 'self'", "connect-src 'self'"]) assert(index.headers['content-security-policy'].includes(directive));
    assert(!index.headers['content-security-policy'].includes("'unsafe-inline'"));assert(!index.headers['content-security-policy'].includes("'unsafe-eval'"));
    for (const pathname of ['/index.html', '/style.css', '/main.js', '/engine/api.js', '/data/maps.js', '/ui/phone.css']) {
      const res = await request(port, pathname);assert.equal(res.status, 200, pathname);security(res);
    }
    for (const pathname of ['/AGENTS.md', '/server/app.cjs', '/codex/PLANO.md', '/../AGENTS.md', '/%2e%2e/', '/assets/../AGENTS.md', '/assets/%2e%2e/AGENTS.md', '/%69ndex.html', '/assets\\..\\AGENTS.md', '/.git/config', '/verify.cjs', '/_render_all.ps1', '/assets/', '/assets/nope.cjs']) {
      const res = await request(port, pathname);assert.equal(res.status, 404, pathname);security(res);
    }
    for (const [pathname, mime] of [['/assets/fonts/vt323-latin-400-normal.woff2','font/woff2'],['/assets/zeroos/trace.svg','image/svg+xml']]) {
      const res = await request(port, pathname);assert.equal(res.status, 200);assert.equal(res.headers['content-type'], mime);
    }
    const worker = await request(port, '/engine/code-worker.js');assert.equal(worker.status, 200);security(worker);assert(worker.headers['content-security-policy'].includes("'unsafe-eval'"));
    const head = await request(port, '/index.html', { method: 'HEAD' });assert.equal(head.status, 200);assert.equal(head.body, '');
    const staticMethod = await request(port, '/index.html', { method: 'POST' });assert.equal(staticMethod.status, 405);assert.equal(staticMethod.headers.allow, 'GET, HEAD');
    const unauthorized = await request(port, '/api/jogo/estado');assert.equal(unauthorized.status, 401);security(unauthorized);
    assert.equal(JSON.parse(unauthorized.body).ok, false);assert.equal(unauthorized.headers['cache-control'], 'no-store');
    const created = await request(port, '/api/jogo/nova-partida', { method: 'POST', body: '{}' });
    assert.equal(created.status, 200);assert.deepEqual(JSON.parse(created.body), { ok: true });security(created);
    const cookieHeader = created.headers['set-cookie'][0];assert.match(cookieHeader, /^zc_sid=[a-f0-9]{48}; HttpOnly; SameSite=Strict; Path=\/$/);
    const cookie = cookieHeader.split(';')[0];
    const state = await request(port, '/api/jogo/estado', { cookie });assert.equal(state.status, 200);assert.deepEqual(JSON.parse(state.body), { ok: true, progresso: [] });
    const second = await request(port, '/api/jogo/nova-partida', { method: 'POST', body: '{}' });assert.notEqual(second.headers['set-cookie'][0], cookieHeader);
    const reset = await request(port, '/api/jogo/nova-partida', { method: 'POST', cookie, body: '{}' });assert.equal(reset.status, 200);
    assert.equal((await request(port, '/api/jogo/estado', { cookie })).status, 200);
    for (const chunked of [false, true]) {
      const large = await request(port, '/api/jogo/nova-partida', { method: 'POST', body: JSON.stringify('x'.repeat(BODY_LIMIT)), chunked });
      assert.equal(large.status, 413);assert.equal(JSON.parse(large.body).ok, false);security(large);
    }
    assert.equal((await request(port, '/api/jogo/nova-partida', { method: 'POST', body: '{' })).status, 400);
    const missing = await request(port, '/api/jogo/inexistente');assert.equal(missing.status, 404);assert.equal(JSON.parse(missing.body).ok, false);security(missing);
    const method = await request(port, '/api/jogo/nova-partida');assert.equal(method.status, 405);assert.equal(method.headers.allow, 'POST');security(method);
    console.log('Servidor: arquivos públicos, bloqueios de caminhos, MIME, cabeçalhos, CSP, sessões isoladas, expiração, reset, JSON e status 401/404/405/413 aprovados.');
  } finally { await new Promise(resolve => app.close(resolve)); }
  const context = { module: { exports: {} }, document: { createElement: () => ({ setAttribute() {} }) }, api: { post: async () => { throw new Error('Servidor indisponível'); } } };
  vm.createContext(context);vm.runInContext(fs.readFileSync('engine/game.js', 'utf8'), context);
  const game = Object.create(context.module.exports.prototype),button = {},root = { querySelector: () => null,append(node) { this.message = node; } };
  let advanced = 0;
  await game._newSession(() => advanced++, button, root);assert.equal(advanced, 0);assert.equal(button.disabled, false);assert.equal(root.message.textContent, 'Servidor indisponível');
  let release;
  context.api.post = (pathname, body) => { assert.equal(pathname, '/api/jogo/nova-partida');assert.equal(JSON.stringify(body), '{}');return new Promise(resolve => { release = resolve; }); };
  const starting = game._newSession(() => advanced++, button, root);assert.equal(advanced, 0);assert.equal(button.disabled, true);
  await game._newSession(() => advanced++, button, root);release({ ok: true });await starting;
  assert.equal(advanced, 1);assert.equal(button.disabled, false);
  console.log('Cliente: nova partida confirmada antes de avançar, erro visível, nova tentativa e prevenção de clique duplicado aprovados.');
}

verify().catch(error => { console.error(error);process.exitCode = 1; });
