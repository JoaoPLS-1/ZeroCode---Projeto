const { perguntas } = require('./data/perguntas.cjs');
const progress = require('./progress.cjs');
const { capturar } = require('./flags.cjs');
const { readJson, json } = require('./router.cjs');
const normalizar = valor => valor.trim().toUpperCase().replace(/\s+/g, ' ');

function installPerguntaRoutes(router, sessions, { now = Date.now } = {}) {
  router.add('GET', '/api/jogo/perguntas', (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res,401,{ ok:false, erro:'Inicie uma nova partida.' });
    json(res,200,{ ok:true, perguntas:perguntas.map(q => {
      const respondida = progress.has(session, 'q:'+q.id);
      return { id:q.id, ordem:q.ordem, pergunta:q.pergunta, tipo:q.tipo,
        ...(q.opcoes ? { opcoes:q.opcoes } : {}), disponivel:q.disponivel !== false,
        dica:q.dica, respondida, ...(respondida ? { conclusao:q.conclusao } : {}) };
    }) });
  });
  router.addPattern('POST', /^\/api\/jogo\/perguntas\/([a-z0-9-]+)$/, async (req, res, [id]) => {
    const session = sessions.get(req);
    if (!session) return json(res,401,{ ok:false, erro:'Inicie uma nova partida.' });
    const q = perguntas.find(q => q.id === id);
    if (!q || q.disponivel === false) return json(res,404,{ ok:false, erro:'Pergunta indisponível.' });
    const body = await readJson(req);
    if (typeof body?.resposta !== 'string' || !body.resposta.trim() || body.resposta.length > 500)
      return json(res,400,{ ok:false, erro:'Informe uma resposta de até 500 caracteres.' });
    const time = now();
    session.perguntasTentativas = (session.perguntasTentativas || []).filter(t => time - t < 60000);
    if (session.perguntasTentativas.length >= 10) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((60000 - time + session.perguntasTentativas[0]) / 1000))));
      return json(res,429,{ ok:false, erro:'Muitas tentativas. Aguarde um minuto antes de tentar novamente.' });
    }
    session.perguntasTentativas.push(time);
    if (![q.resposta,...(q.aliases || [])].some(resposta => normalizar(body.resposta) === normalizar(resposta)))
      return json(res,200,{ ok:false, mensagem:'A resposta ainda não confere com os registros. Continue investigando.' });
    progress.set(session, 'q:'+id);
    json(res,200,{ ok:true, respondida:true, conclusao:q.conclusao,
      ...(q.flag ? { captura:capturar(session,q.flag) } : {}), ...progress.state(session) });
  });
}
module.exports = { normalizar, installPerguntaRoutes };
