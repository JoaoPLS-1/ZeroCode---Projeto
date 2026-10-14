const repo = require('./data/repo.cjs');
const progress = require('./progress.cjs');
const { capturar } = require('./flags.cjs');
const { readJson, json } = require('./router.cjs');
const stations = ['computer_dev_left','computer_dev_right'];
const fail = (status,message) => { throw Object.assign(new Error(message), { status }); };

function validarReview(linhas) {
  return Array.isArray(linhas) && linhas.length === repo.linhasProblematicas.length &&
    new Set(linhas).size === linhas.length && repo.linhasProblematicas.every(id => linhas.includes(id));
}
function installRepoRoutes(router, sessions) {
  const sessionFor = req => sessions.get(req) || fail(401,'Inicie uma nova partida.');
  const stationFor = req => {
    const station = new URL(req.url,'http://localhost').searchParams.get('estacao');
    if (!stations.includes(station)) fail(404,'Repositório indisponível nesta estação.');
  };
  const get = (path,read) => router.add('GET','/api/jogo/repo/'+path,(req,res) => {
    const session = sessionFor(req); stationFor(req);
    json(res,200,{ ok:true,nome:repo.nome,...read(req,session) });
  });
  get('historico',() => ({ commits:[...repo.commits].reverse().map(({diff,...commit}) => commit) }));
  get('blame',req => {
    const arquivo = new URL(req.url,'http://localhost').searchParams.get('arquivo');
    if (!Object.hasOwn(repo.blame,arquivo)) fail(404,'Arquivo não encontrado.');
    return { arquivo,linhas:repo.blame[arquivo] };
  });
  get('prs',() => ({ prs:repo.pullRequests.map(({diff,descricao,...pr}) => pr) }));
  router.addPattern('GET',/^\/api\/jogo\/repo\/commits\/([a-f0-9]+)$/,(req,res,[hash]) => {
    sessionFor(req); stationFor(req);
    const commit = repo.commits.find(commit => commit.hash === hash);
    if (!commit) fail(404,'Commit não encontrado.');
    json(res,200,{ ok:true,commit });
  });
  router.addPattern('GET',/^\/api\/jogo\/repo\/prs\/(\d+)$/,(req,res,[numero]) => {
    const session = sessionFor(req); stationFor(req);
    const pr = repo.pullRequests.find(pr => pr.numero === Number(numero));
    if (!pr) fail(404,'Pull request não encontrado.');
    json(res,200,{ ok:true,pr,revisado:progress.has(session,'review:retry') });
  });
  router.addPattern('POST',/^\/api\/jogo\/repo\/prs\/(\d+)\/review$/,async (req,res,[numero]) => {
    const session = sessionFor(req); stationFor(req);
    if (numero !== '214') fail(404,'Pull request não encontrado.');
    const body = await readJson(req);
    const ids = repo.pullRequests[0].diff.flatMap(file => file.linhas.map(line => line.id));
    if (!Array.isArray(body?.linhas) || body.linhas.length > ids.length ||
        body.linhas.some(id => typeof id !== 'string' || !ids.includes(id)) || new Set(body.linhas).size !== body.linhas.length)
      fail(400,'Envie uma lista de linhas válidas, sem duplicatas.');
    if (!validarReview(body.linhas)) {
      // Sem bloqueio permanente: três erros não tiram a possibilidade de aprender.
      session.repoErros = Math.min(3,(session.repoErros || 0) + 1);
      return json(res,200,{ ok:false,mensagem:'Revise de novo: marque todas as linhas que removem as proteções ou tornam o reenvio infinito, sem incluir linhas inofensivas.' });
    }
    progress.set(session,'review:retry');
    json(res,200,{ ok:true,revisado:true,mensagem:'Revisão concluída.',captura:capturar(session,'retry-E'),...progress.state(session) });
  });
}
module.exports = { validarReview, installRepoRoutes };
