const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const progress = require('./server/progress.cjs');
const Progress = require('./engine/progress.js');
const { createApp } = require('./server/app.cjs');
const { missions } = require('./server/data/missions.cjs');

async function verify() {
  const session = { progresso: [] }, mirror = new Progress(), received = [];
  const off = mirror.on(key => received.push(key));
  for (const key of ['talk:npc_qa', 'flag:a', 'flag:b', 'mem:1']) {
    assert(progress.set(session, key));assert(!progress.set(session, key));assert(progress.has(session, key));
  }
  assert.equal(progress.count(session, 'flag:'), 2);assert.equal(progress.count(session, 'file:'), 0);
  const copy = progress.all(session);copy.push('flag:local');assert(!progress.has(session, 'flag:local'));
  mirror.sincronizar(progress.state(session));mirror.sincronizar(progress.state(session));
  assert.deepEqual(received, session.progresso);
  assert.equal(mirror.count('flag:'), 2);assert.equal(mirror.count('file:'), 0);
  const conditions = [
    [undefined, true], [null, true], ['talk:npc_qa', true], ['talk:missing', false],
    [{ all: [] }, true], [{ any: [] }, false],
    [{ all: ['flag:a', 'flag:b'] }, true], [{ all: ['flag:a', 'flag:c'] }, false],
    [{ any: ['flag:c', 'flag:b'] }, true], [{ any: ['flag:c'] }, false],
    [{ count: { prefix: 'flag:', min: 2 } }, true], [{ count: { prefix: 'flag:', min: 3 } }, false],
    [{ count: { prefix: 'file:', min: 0 } }, true],
    [{ all: ['talk:npc_qa', { any: ['flag:c', { count: { prefix: 'mem:', min: 1 } }] }] }, true],
    [{ any: [{ all: ['flag:c', null] }, { count: { prefix: 'mem:', min: 2 } }] }, false],
    [{}, false], [42, false], [{ count: { prefix: 'flag:', min: -1 } }, false],
  ];
  for (const [cond, expected] of conditions) {
    assert.equal(progress.requires(session, cond), expected, JSON.stringify(cond));
    assert.equal(mirror.requires(cond), expected, JSON.stringify(cond));
  }
  progress.set(session, 'clue:extra');mirror.sincronizar(progress.state(session));
  assert.equal(received.length, 5);assert.equal(received[4], 'clue:extra');
  const local = mirror.all();local.push('flag:local');assert(!mirror.has('flag:local'));
  mirror.sincronizar({ ok: true });assert(mirror.has('clue:extra'));
  off();mirror.sincronizar({ progresso: [] });assert.deepEqual(mirror.all(), []);
  mirror.sincronizar({ progresso: ['talk:npc_qa', 'talk:npc_qa'] });assert.equal(received.length, 5);
  assert.equal(mirror.count('talk:'), 1);assert.equal(typeof mirror.set, 'undefined');
  console.log('Progresso: set/has/all/count, cópias isoladas, requires em todas as formas e aninhamento, espelho, notificações únicas, cancelamento e reset aprovados.');

  const app = createApp();
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.address().port;
  let cookie;
  async function call(path, body, expected = 200, sessionCookie = cookie) {
    const response = await fetch(base + path, {
      method: body === undefined ? 'GET' : 'POST',
      headers: { ...(sessionCookie ? { Cookie: sessionCookie } : {}), 'Content-Type': 'application/json' },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    assert.equal(response.status, expected, path);
    assert.equal(response.headers.get('cache-control'), 'no-store');
    return { payload: await response.json(), cookie: response.headers.get('set-cookie')?.split(';')[0] };
  }
  try {
    await call('/api/jogo/eventos', { chave: 'talk:npc_qa' }, 401);
    cookie = (await call('/api/jogo/nova-partida', {})).cookie;
    const initial = (await call('/api/jogo/estado')).payload;
    assert.deepEqual(initial, { ok: true, modo:'completo', salas:'*', metaLembrancas:5, progresso: [], contagem: { flags: 0, lembrancas: 0 } });
    for (const chave of ['flag:x', 'clue:x', 'app:x', 'q:x', 'talk:inexistente', 'mem:1', 'file:inexistente', '__proto__', '', 1, null])
      await call('/api/jogo/eventos', { chave }, 403);
    await call('/api/jogo/eventos', {}, 403);await call('/api/jogo/eventos', null, 403);
    assert.deepEqual((await call('/api/jogo/estado')).payload, initial);
    const talked = (await call('/api/jogo/eventos', { chave: 'talk:npc_qa' })).payload;
    assert.deepEqual(talked.progresso, ['talk:npc_qa']);
    assert.deepEqual((await call('/api/jogo/eventos', { chave: 'talk:npc_qa' })).payload, talked);
    const execution = (await call('/api/jogo/missoes/' + missions[0].id + '/execucao', {})).payload;
    const solved = (await call('/api/jogo/missoes/' + missions[0].id + '/execucao/' + execution.execucao,
      { saidas: execution.entradas.map(missions[0].reference) })).payload;
    assert(solved.ok);assert(solved.progresso.includes('clue:' + missions[0].clueRef));
    assert.deepEqual((await call('/api/jogo/missoes')).payload.progresso, solved.progresso);
    const other = (await call('/api/jogo/nova-partida', {}, 200, '')).cookie;
    assert.deepEqual((await call('/api/jogo/estado', undefined, 200, other)).payload.progresso, []);
    await call('/api/jogo/nova-partida', {});
    assert.deepEqual((await call('/api/jogo/estado')).payload, initial);
    console.log('Eventos por HTTP: sessão obrigatória, talk:npc_qa aceito, eventos proibidos recusados com 403, deduplicação, pista de missão, contagem, isolamento e nova partida aprovados.');
  } finally { await new Promise(resolve => app.close(resolve)); }

  const apiScope = vm.createContext({ AbortController, setTimeout, clearTimeout,
    fetch: async () => ({ ok: true, json: async () => ({ progresso: ['talk:npc_qa'] }) }) });
  vm.runInContext(fs.readFileSync('engine/api.js', 'utf8') + '\nglobalThis.clientApi=api;', apiScope);
  const apiMirror = new Progress();apiScope.clientApi.onEstado(estado => apiMirror.sincronizar(estado));
  await apiScope.clientApi.post('/api/jogo/eventos', { chave: 'talk:npc_qa' });assert(apiMirror.has('talk:npc_qa'));
  apiScope.fetch = async () => ({ ok: true, json: async () => ({ ok: false, progresso: ['clue:teste'] }) });
  await apiScope.clientApi.post('/api/jogo/missoes/teste/execucao/id', {});assert(apiMirror.has('clue:teste'));
  const gameScope = vm.createContext({ module: { exports: {} }, console,
    api: { post: async (path, body) => {
      assert.equal(path, '/api/jogo/eventos');assert.equal(body.chave, 'talk:npc_qa');
      apiMirror.sincronizar({ progresso: [body.chave] });
    } } });
  vm.runInContext(fs.readFileSync('engine/game.js', 'utf8'), gameScope);
  const game = Object.create(gameScope.module.exports.prototype);
  let complete;
  Object.assign(game, { dialogsData: { qa: {} }, dialogue: { open(def, callback) { complete = callback; } },
    hud: { showPrompt() {}, update() {} }, clues: { addClue() {}, getState() {} }, _lockInteractions() {} });
  apiMirror.sincronizar({ progresso: [] });
  game._openContainerContent({ type: 'npc', id: 'npc_qa' }, 'qa');assert(!apiMirror.has('talk:npc_qa'));
  complete();await Promise.resolve();assert(apiMirror.has('talk:npc_qa'));
  console.log('Cliente: respostas da API sincronizam o espelho e diálogo relata talk: apenas ao concluir aprovado.');
}

verify().catch(error => { console.error(error);process.exitCode = 1; });
