const { randomBytes } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const { missions, inputs } = require('./data/missions.cjs');
const { readJson, json } = require('./router.cjs');
const progress = require('./progress.cjs');
const EXECUTION_TTL = 60000;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };

function createMissionService({ now = Date.now } = {}) {
  function states(session) {
    session.missoes ??= missions.map((m,i) => ({ id:m.id, errors:0, solved:false, unlocked:i===0,
      password:i<missions.length-1?'ZERO-'+randomBytes(8).toString('hex').toUpperCase():null, execution:null }));
    return session.missoes;
  }
  function station(session, id) {
    const index = missions.findIndex(m => m.id === id);
    if (index < 0) fail(404, 'Missão não encontrada.');
    return { mission:missions[index], state:states(session)[index], index };
  }
  function active(session, state) {
    if (session.gameOver) fail(409, 'A partida terminou. Inicie uma nova investigação.');
    if (!state.unlocked) fail(403, 'Estação protegida.');
    if (state.solved) fail(409, 'Missão já resolvida.');
  }
  return {
    list(session) {
      return { ok:true, ...progress.state(session), gameOver:session.gameOver, missoes:states(session).map((state,i) => ({
        ...missions[i].public, bloqueada:!state.unlocked, resolvida:state.solved, erros:state.errors,
        ...(state.solved?{ recompensa:missions[i].reward, clueRef:missions[i].clueRef,
          ...(state.password?{senha:state.password}:{}) }:{})
      })) };
    },
    start(session, id) {
      const { mission, state } = station(session, id);active(session, state);
      const entradas = inputs(mission), execucao = randomBytes(24).toString('hex');
      const expected = entradas.map(mission.reference);
      // Até nas missões booleanas, a sequência de saídas muda entre execuções.
      if (state.lastExpected && isDeepStrictEqual(expected,state.lastExpected)) {
        const j=expected.findIndex(value=>!isDeepStrictEqual(value,expected[0]));
        [entradas[0],entradas[j]]=[entradas[j],entradas[0]];
        [expected[0],expected[j]]=[expected[j],expected[0]];
      }
      state.lastExpected=expected;
      // Apenas a execução mais recente de cada PC continua válida.
      state.execution = { id:execucao, created:now(), entradas, expected };
      return { ok:true, execucao, entradas };
    },
    submit(session, id, executionId, body) {
      const { mission, state } = station(session, id);active(session, state);
      const execution = state.execution;
      if (!execution || execution.id !== executionId) fail(409, 'Execução inválida ou já utilizada.');
      if (now()-execution.created >= EXECUTION_TTL) { state.execution=null;fail(409, 'Execução expirada. Execute novamente.'); }
      if (!body || !Array.isArray(body.saidas) || body.saidas.length !== execution.entradas.length ||
        (body.erro !== undefined && (typeof body.erro !== 'string' || !body.erro.length || body.erro.length > 300))) {
        fail(400, 'Envie uma saída para cada entrada e, se necessário, uma mensagem de erro.');
      }
      state.execution = null;
      const resultados = execution.entradas.map((entrada,i) => {
        const passou = !body.erro && isDeepStrictEqual(body.saidas[i], execution.expected[i]);
        return { teste:i+1, passou, entrada, recebido:body.saidas[i], ...(passou?{}:{esperado:execution.expected[i]}) };
      });
      const ok = resultados.every(r => r.passou);
      if (ok) {
        state.solved=true;
        progress.set(session, 'clue:'+mission.clueRef);
      } else {
        state.errors++;
        if (state.errors >= 3) session.gameOver=true;
      }
      return { ok, ...progress.state(session), resultados, erros:state.errors, gameOver:session.gameOver,
        ...(body.erro?{erroExecucao:body.erro}:{}),
        ...(ok?{recompensa:mission.reward, clueRef:mission.clueRef, ...(state.password?{senha:state.password}:{})}:{}) };
    },
    unlock(session, id, body) {
      const { state, index } = station(session, id);
      if (!body || typeof body.senha !== 'string' || body.senha.length > 32) fail(400, 'Senha deve ser um texto de até 32 caracteres.');
      if (session.gameOver) fail(409, 'A partida terminou.');
      const previous = states(session)[index-1];
      const ok = index===0 || !!(previous.solved && previous.password===body.senha);
      if (ok) state.unlocked=true;
      return { ok };
    }
  };
}

function installMissionRoutes(router, sessions) {
  const service = createMissionService();
  const sessionFor = req => sessions.get(req) || fail(401, 'Inicie uma nova partida.');
  router.add('GET', '/api/jogo/missoes', (req,res) => json(res,200,service.list(sessionFor(req))));
  router.addPattern('POST', /^\/api\/jogo\/missoes\/([^/]+)\/execucao$/, async (req,res,[id]) => {
    const session=sessionFor(req);await readJson(req);json(res,200,service.start(session,id));
  });
  router.addPattern('POST', /^\/api\/jogo\/missoes\/([^/]+)\/execucao\/([^/]+)$/, async (req,res,[id,execution]) => {
    const session=sessionFor(req), body=await readJson(req);
    json(res,200,service.submit(session,id,execution,body));
  });
  router.addPattern('POST', /^\/api\/jogo\/missoes\/([^/]+)\/desbloquear$/, async (req,res,[id]) => {
    const session=sessionFor(req), body=await readJson(req);
    json(res,200,service.unlock(session,id,body));
  });
}

module.exports = { createMissionService, installMissionRoutes, EXECUTION_TTL };
