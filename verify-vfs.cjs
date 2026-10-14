const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const vfs = require('./server/vfs.cjs');
const { VFS_FILES } = require('./server/data/vfs.cjs');
const { createApp } = require('./server/app.cjs');
const RemoteFS = require('./engine/os/vfs.js');

async function verify() {
  const station = 'computer_dev_left', session = { progresso: [] };
  const remote = new RemoteFS({}, station);
  for (const [cwd, input, expected] of [
    ['/', '..', '/'], ['/var/log', '../../../../../', '/'], ['/var/log', '.././log//nexus.log', '/var/log/nexus.log'],
    ['/var', 'log', '/var/log'], ['/var', '/home/kael', '/home/kael'], ['/', '~', '/home/kael'],
    ['/var', '~/../kael/leia-me.txt', '/home/kael/leia-me.txt'], ['/home/kael', '.', '/home/kael'],
    ['/', '', '/'], ['/', '~outro', '/~outro'],
  ]) {
    assert.equal(vfs.resolve(cwd, input), expected);
    assert.equal(await remote.resolve(cwd, input), expected);
  }
  assert.deepEqual(vfs.list(session, station, '/').entries.map(e => e.name), ['home', 'var']);
  const before = JSON.stringify(session);
  assert.equal(vfs.list(session, station, '/srv'), null);
  assert.equal(vfs.read(session, station, '/srv/equipe/contatos.txt'), null);
  assert.equal(vfs.read(session, station, '/home/kael'), null);
  assert.equal(vfs.list(session, station, '/var/log/nexus.log'), null);
  assert.equal(vfs.read(session, 'manager_dante', '/home/kael/leia-me.txt'), null);
  assert.equal(JSON.stringify(session), before);
  assert(vfs.read(session, station, '/home/kael/leia-me.txt').content);
  assert.deepEqual(session.progresso, ['file:leia-me']);
  assert.deepEqual(vfs.list(session, station, '/').entries.map(e => e.name), ['home', 'srv', 'var']);
  assert(vfs.read(session, station, '/srv/equipe/contatos.txt').content);
  vfs.read(session, station, '/home/kael/leia-me.txt');
  assert.equal(session.progresso.filter(k => k === 'file:leia-me').length, 1);
  assert.equal(VFS_FILES['/var/log/nexus.log'].content.split('\n').length, 15);
  // Dados de teste exclusivos do servidor, removidos antes dos testes HTTP.
  VFS_FILES['/restrito/teste.txt'] = { id: 'teste', content: 'teste', stations: ['computer_infra_upper'], grants: ['clue:teste'] };
  try {
    assert.equal(vfs.list(session, station, '/restrito'), null);
    assert.equal(vfs.read(session, station, '/restrito/teste.txt'), null);
    assert(!session.progresso.includes('file:teste'));
    assert(vfs.list(session, 'computer_infra_upper', '/restrito'));
    assert(vfs.read(session, 'computer_infra_upper', '/restrito/teste.txt'));
    assert(session.progresso.includes('clue:teste'));
  } finally { delete VFS_FILES['/restrito/teste.txt']; }
  console.log('VFS: resolve, raiz, caminhos relativos, ~, list/read, requires, stations, grants e leituras idempotentes aprovados.');

  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.address().port;
  let cookie;
  async function call(path, body, expected = 200, sessionCookie = cookie) {
    const response = await fetch(base + path, { method: body === undefined ? 'GET' : 'POST',
      headers: { ...(sessionCookie ? { Cookie: sessionCookie } : {}), 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
    assert.equal(response.status, expected, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return { payload: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  const path = (route, filename, computer = station) => '/api/jogo/fs/' + route + '?estacao=' + encodeURIComponent(computer) + '&caminho=' + encodeURIComponent(filename);
  try {
    for (const route of ['lista', 'arquivo']) await call(path(route, '/'), undefined, 401);
    cookie = (await call('/api/jogo/nova-partida', {})).cookie;
    const initial = (await call('/api/jogo/estado')).payload;
    const responses = [];
    for (const route of ['lista', 'arquivo']) {
      const missing = (await call(path(route, '/inexistente'), undefined, 404)).payload;
      for (const name of ['/srv', '/srv/equipe', '/srv/equipe/contatos.txt']) {
        const hidden = (await call(path(route, name), undefined, 404)).payload;
        assert.deepEqual(hidden, missing);responses.push(hidden);
      }
      for (const invalid of ['manager_dante', '__proto__', '', 'computer_inexistente'])
        assert.deepEqual((await call(path(route, '/', invalid), undefined, 404)).payload, missing);
      await call('/api/jogo/fs/' + route, undefined, 404);
    }
    await call('/api/jogo/eventos', { chave: 'file:leia-me' }, 403);
    await call('/api/jogo/eventos', { chave: 'file:contatos' }, 403);
    responses.push((await call(path('lista', '/'))).payload);
    responses.push((await call(path('arquivo', '/var/log/nexus.log'))).payload);
    assert(!JSON.stringify(responses).includes(VFS_FILES['/srv/equipe/contatos.txt'].content));
    // Recomeçar para executar o roteiro exato do console com a API real do cliente.
    await call('/api/jogo/nova-partida', {});
    const scope = vm.createContext({ AbortController, setTimeout, clearTimeout,
      fetch: (url, options) => fetch(base + url, { ...options, headers: { ...options.headers, Cookie: cookie } }) });
    vm.runInContext(fs.readFileSync('engine/api.js', 'utf8') + '\nglobalThis.clientApi=api;', scope);
    const client = new RemoteFS(scope.clientApi, station);
    const states = [];
    scope.clientApi.onEstado(state => states.push(state));
    assert.deepEqual((await client.list('/')).entries.map(e => e.name), ['home', 'var']);
    await assert.rejects(() => client.read('/srv/equipe/contatos.txt'), /Arquivo não encontrado/);
    assert.deepEqual((await call('/api/jogo/estado')).payload, initial);
    await client.read('/home/kael/leia-me.txt');
    assert.deepEqual(states[0].progresso, ['file:leia-me']);
    assert.deepEqual((await client.list('/')).entries.map(e => e.name), ['home', 'srv', 'var']);
    assert.equal((await client.read('/srv/equipe/contatos.txt')).content, VFS_FILES['/srv/equipe/contatos.txt'].content);
    assert.deepEqual((await client.list('/../../../../')).entries.map(e => e.name), ['home', 'srv', 'var']);
    const listing = await client.list('/home/kael');
    assert.deepEqual(Object.keys(listing.entries[0]).sort(), ['modified', 'name', 'path', 'size', 'type']);
    const other = (await call('/api/jogo/nova-partida', {}, 200, '')).cookie;
    await call(path('arquivo', '/srv/equipe/contatos.txt'), undefined, 404, other);
    await call('/api/jogo/nova-partida', {});
    await call(path('arquivo', '/srv/equipe/contatos.txt'), undefined, 404);
    for (const filename of ['/server/data/vfs.cjs', '/server/vfs.cjs', '/verify-vfs.cjs']) {
      const response = await fetch(base + filename);assert.equal(response.status, 404);
    }
    const script = await fetch(base + '/engine/os/vfs.js');assert.equal(script.status, 200);
    const index = await (await fetch(base + '/')).text();
    assert(index.indexOf('engine/api.js') < index.indexOf('engine/os/vfs.js'));
    console.log('VFS HTTP: sessão, estação validada, 404 idêntico, conteúdo oculto protegido, eventos file: recusados, progresso, isolamento, reset e estáticos privados aprovados.');
    console.log('Console (RemoteFS + api real por HTTP): raiz home/ e var/; após ler leia-me, raiz home/, srv/ e var/; contatos liberados.');
  } finally { await new Promise(resolve => app.close(resolve)); }
}

verify().catch(error => { console.error(error);process.exitCode = 1; });
