const { flags, senhaLembrada } = require('./data/flags.cjs');
const progress = require('./progress.cjs');
const { readJson, json } = require('./router.cjs');
const catalogo = new Map(flags.map(flag => [flag.id, flag]));
const modos = require('./data/modos.cjs');
const meta = sessao => modos[sessao.modo || 'completo'].metaLembrancas;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const fichaPublica = flag => ({ titulo:flag.titulo, conceito:flag.conceito, ficha:flag.ficha,
  lembranca:flag.lembranca, vibecodeErrou:flag.vibecodeErrou });

function capturar(sessao, id) {
  const flag = catalogo.get(id);
  if (!flag) fail(404, 'Flag não encontrada.');
  const nova = progress.set(sessao, 'flag:'+id);
  if (nova) progress.set(sessao, 'mem:'+id);
  const lembrancas = progress.count(sessao, 'mem:');
  const wiresharkLiberado = nova && lembrancas >= meta(sessao) && progress.set(sessao, 'evento:senha-lembrada');
  if (wiresharkLiberado) progress.set(sessao, 'app:wireshark');
  return { nova, flag:fichaPublica(flag), lembrancas, wiresharkLiberado,
    ...(wiresharkLiberado ? { senhaLembrada:structuredClone(sessao.modo === 'rapido' ? [{speaker:'npc',text:'D.A.N.I.E.L.: Duas lembranças recuperadas. A captura de rede está disponível no Dev 1.'}] : senhaLembrada) } : {}) };
}
function listar(sessao) {
  return { flags:flags.filter(flag => progress.has(sessao, 'flag:'+flag.id)).map(fichaPublica),
    lembrancas:progress.count(sessao, 'mem:'), meta:meta(sessao) };
}
function installFlagRoutes(router, sessions) {
  const sessionFor = req => sessions.get(req) || fail(401, 'Inicie uma nova partida.');
  router.add('GET', '/api/jogo/flags', (req,res) => json(res,200,{ ok:true, ...listar(sessionFor(req)) }));
  // A existência da rota é decidida ao iniciar o servidor, nunca pelo cliente.
  if (process.env.ZC_DEV === '1') router.add('POST', '/api/jogo/dev/flag', async (req,res) => {
    const sessao = sessionFor(req), body = await readJson(req);
    if (typeof body?.id !== 'string') fail(400, 'Informe o identificador da flag.');
    const captura = capturar(sessao, body.id);
    json(res,200,{ ok:true, captura, ...progress.state(sessao) });
  });
}
module.exports = { capturar, listar, installFlagRoutes };
