const capitulos = require('./data/pitch.cjs');
const progress = require('./progress.cjs');
const { capturar } = require('./flags.cjs');
const { json } = require('./router.cjs');

function installPitchRoutes(router, sessions) {
  router.addPattern('POST', /^\/api\/jogo\/pitch\/capitulo\/([^/]+)$/, (req,res,[entrada]) => {
    const session = sessions.get(req);
    if (session?.modo !== 'pitch') return json(res,403,{ok:false,erro:'Disponível apenas no modo apresentação.'});
    const n = Number(entrada);
    if (!/^[1-6]$/.test(entrada) || !Number.isInteger(n))
      return json(res,400,{ok:false,erro:'Informe um capítulo de 1 a 6.'});
    // Invalida também execuções, dicas, captura e decisão anteriores ao salto.
    sessions.reset(session);
    session.modo = 'pitch';
    const { progresso, ...capitulo } = capitulos[n-1];
    const flag = capitulo.acao.startsWith('mostrar-flag:') ? capitulo.acao.slice('mostrar-flag:'.length) : null;
    // A ficha atravessa o mesmo fluxo de captura do jogo, sem rota dev.
    for (const chave of progresso) {
      if (flag && (chave === 'flag:'+flag || chave === 'mem:'+flag)) continue;
      progress.set(session,chave);
    }
    const captura = flag ? capturar(session,flag) : null;
    json(res,200,{ok:true,capitulo:n,...capitulo,total:capitulos.length,
      ...(captura ? {captura} : {}), ...progress.state(session)});
  });
}
module.exports = { installPitchRoutes };
