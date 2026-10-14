const NPCS = require('../data/npcs.js');
const { readJson, json } = require('./router.cjs');
const capture = require('./data/capture.cjs');
const omega = require('./data/omega.cjs');
const allowedEvents = new Set(NPCS.map(npc => 'talk:' + npc.id));
// file: é registrado exclusivamente pela leitura autorizada no VFS, nunca por evento manual.

function has(session, key) { return session.progresso.includes(key); }
function set(session, key) {
  if (has(session, key)) return false;
  session.progresso.push(key);
  return true;
}
function all(session) { return [...session.progresso]; }
function count(session, prefix) { return session.progresso.filter(key => key.startsWith(prefix)).length; }
function requires(session, cond) {
  if (cond == null) return true;
  if (typeof cond === 'string') return has(session, cond);
  if (typeof cond !== 'object') return false;
  if (Array.isArray(cond.all)) return cond.all.every(c => requires(session, c));
  if (Array.isArray(cond.any)) return cond.any.some(c => requires(session, c));
  if (cond.count && typeof cond.count.prefix === 'string' && Number.isInteger(cond.count.min) && cond.count.min >= 0)
    return count(session, cond.count.prefix) >= cond.count.min;
  return false;
}
function state(session) {
  return { progresso: all(session), contagem: { flags: count(session, 'flag:'), lembrancas: count(session, 'mem:') } };
}
function installProgressRoutes(router, sessions) {
  router.add('POST', '/api/jogo/eventos', async (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res, 401, { ok: false, erro: 'Inicie uma nova partida.' });
    const body = await readJson(req);
    if (body?.chave === 'evento:omega-encontrada') {
      if (!has(session, 'acesso:sala-secreta') || body.sala !== 'room_secret')
        return json(res, 403, { ok:false, erro:'Evento não permitido.' });
      const nova = set(session, body.chave);
      return json(res, 200, { ok:true, nova, ...(nova ? { cena:omega.cena } : {}), ...state(session) });
    }
    if (body?.chave === 'evento:batimento-visto') {
      if (!has(session, 'app:wireshark') || !session.capturaAberta || body.estacao !== 'computer_infra_upper' || !capture.suspeito(body.pacote))
        return json(res, 403, { ok:false, erro:'Evento não permitido.' });
      const nova = set(session, body.chave);
      return json(res, 200, { ok:true, nova, ...(nova ? { pensamento:capture.pensamento } : {}), ...state(session) });
    }
    if (!allowedEvents.has(body?.chave)) return json(res, 403, { ok: false, erro: 'Evento não permitido.' });
    set(session, body.chave);
    json(res, 200, { ok: true, ...state(session) });
  });
  router.add('GET', '/api/jogo/omega', (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res, 401, { ok:false, erro:'Inicie uma nova partida.' });
    if (!has(session, 'evento:omega-encontrada'))
      return json(res, 403, { ok:false, erro:'Encontre ÔMEGA antes de acessar o console.' });
    json(res, 200, { ok:true, dialogo:omega.console, chamar:omega.chamar, ...state(session) });
  });
  router.add('GET', '/api/jogo/decisao/acesso', (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res, 401, { ok:false, erro:'Inicie uma nova partida.' });
    const liberada = has(session, 'evento:omega-encontrada');
    json(res, 200, { ok:true, liberada, ...(session.decisao ? {resultado:session.decisao} : {}), ...(!liberada ? { dialogo:omega.bloqueada } : {}), ...state(session) });
  });
}

module.exports = { set, has, all, count, requires, state, installProgressRoutes };
