const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const { createSessions, SESSION_TTL } = require('./server/sessions.cjs');
const { BODY_LIMIT } = require('./server/router.cjs');
const { missions:privateMissions } = require('./server/data/missions.cjs');

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

async function verifyMissionApi(port,cookie) {
  const resolved=new Set();
  function inspect(payload) {
    if (!payload || typeof payload!=='object') return;
    for (const [key,value] of Object.entries(payload)) {
      assert(!['tests','reference','references','fixed','generate','password','reward'].includes(key),'Campo privado: '+key);
      assert.notEqual(typeof value,'function');inspect(value);
    }
    if (payload.id && !resolved.has(payload.id)) {
      assert(!('senha' in payload),'Senha antes de resolver');assert(!('recompensa' in payload));
    }
  }
  async function call(path,{method='GET',body,expected=200,sessionCookie=cookie}={}) {
    const response=await request(port,path,{method,cookie:sessionCookie,...(body!==undefined?{body:JSON.stringify(body)}:{})});
    assert.equal(response.status,expected,path);security(response);
    assert.equal(response.headers['cache-control'],'no-store');
    const payload=JSON.parse(response.body);inspect(payload);return payload;
  }
  const root='/api/jogo/missoes';
  await call(root,{sessionCookie:'zc_sid=invalida',expected:401});
  await call(root,{method:'POST',body:{},expected:405});
  const initial=await call(root);assert.equal(initial.missoes.length,5);
  assert(initial.missoes.every((m,i)=>m.erros===0&&!m.resolvida&&m.bloqueada===(i>0)));
  await call(root+'/inexistente/execucao',{method:'POST',body:{},expected:404});
  await call(root+'/'+privateMissions[1].id+'/execucao',{method:'POST',body:{},expected:403});
  for(let i=0;i<privateMissions.length;i++) {
    const mission=privateMissions[i],path=root+'/'+mission.id;
    const start=await call(path+'/execucao',{method:'POST',body:{}});
    assert.deepEqual(Object.keys(start).sort(),['entradas','execucao','ok']);
    assert(start.entradas.length>mission.fixed.length);
    await call(path+'/execucao/'+start.execucao,{method:'POST',body:{saidas:[]},expected:400});
    if(i===0) {
      const failed=await call(path+'/execucao/'+start.execucao,{method:'POST',body:{saidas:start.entradas.map(()=>true)}});
      assert(!failed.ok);assert.equal(failed.erros,1);assert(!('senha' in failed));assert(!('recompensa' in failed));
      for(const test of failed.resultados)assert.equal('esperado' in test,!test.passou);
      await call(path+'/execucao/'+start.execucao,{method:'POST',body:{saidas:start.entradas.map(mission.reference)},expected:409});
      Object.assign(start,await call(path+'/execucao',{method:'POST',body:{}}));
    }
    const success=await call(path+'/execucao/'+start.execucao,{method:'POST',body:{saidas:start.entradas.map(mission.reference)}});
    assert(success.ok);resolved.add(mission.id);
    assert(success.resultados.every(t=>t.passou&&!('esperado' in t)));
    assert.equal(success.clueRef,mission.clueRef);
    const listed=(await call(root)).missoes[i];assert(listed.resolvida);assert.equal(listed.senha,success.senha);
    if(i<privateMissions.length-1) {
      const unlock=root+'/'+privateMissions[i+1].id+'/desbloquear';
      await call(unlock,{method:'POST',body:{senha:42},expected:400});
      await call(unlock,{method:'POST',body:{senha:'x'.repeat(33)},expected:400});
      assert(!(await call(unlock,{method:'POST',body:{senha:'ERRADA'}})).ok);
      assert((await call(unlock,{method:'POST',body:{senha:success.senha}})).ok);
    } else assert(!('senha' in success));
  }
  const progress=await call('/api/jogo/estado');assert.equal(progress.progresso.length,5);
  const other=await request(port,'/api/jogo/nova-partida',{method:'POST',body:'{}'});
  const otherCookie=other.headers['set-cookie'][0].split(';')[0];
  const isolated=await call(root,{sessionCookie:otherCookie});assert(isolated.missoes.every(m=>!m.resolvida&&m.erros===0&&!('senha' in m)));
  await call('/api/jogo/nova-partida',{method:'POST',body:{}});resolved.clear();
  const reset=await call(root);assert(reset.missoes.every(m=>!m.resolvida&&m.erros===0&&!('senha' in m)));
  const old=await call(root+'/'+privateMissions[0].id+'/execucao',{method:'POST',body:{}});
  await call('/api/jogo/nova-partida',{method:'POST',body:{}});
  await call(root+'/'+privateMissions[0].id+'/execucao/'+old.execucao,{method:'POST',body:{saidas:old.entradas.map(privateMissions[0].reference)},expected:409});
  console.log('API de missões: cinco missões por HTTP, entradas sem gabarito, senha só após sucesso, respostas públicas, desbloqueio, validação, execução única, progresso, isolamento e reset aprovados.');
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
    for (const pathname of ['/AGENTS.md', '/server/app.cjs', '/server/missions.cjs', '/server/data/missions.cjs', '/codex/PLANO.md', '/../AGENTS.md', '/%2e%2e/', '/assets/../AGENTS.md', '/assets/%2e%2e/AGENTS.md', '/%69ndex.html', '/assets\\..\\AGENTS.md', '/.git/config', '/verify.cjs', '/_render_all.ps1', '/assets/', '/assets/nope.cjs']) {
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
    await verifyMissionApi(port,cookie);
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
  const apiScope=vm.createContext({AbortController,setTimeout,clearTimeout,fetch:async()=>({ok:true,json:async()=>({ok:false,erros:1})})});
  vm.runInContext(fs.readFileSync('engine/api.js','utf8')+'\nglobalThis.clientApi=api;',apiScope);
  assert.equal((await apiScope.clientApi.post('/api/jogo/missoes/teste/execucao/id',{saidas:[]})).ok,false,'Falha de teste deve chegar à UI');
  apiScope.fetch=async()=>({ok:false,json:async()=>({ok:false,erro:'Inicie uma nova partida.'})});
  await assert.rejects(()=>apiScope.clientApi.get('/api/jogo/missoes'),/Inicie uma nova partida/);
}

verify().catch(error => { console.error(error);process.exitCode = 1; });
