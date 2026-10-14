// Rotas S2 compatíveis usando o mesmo motor e estado dos desafios.
const { createChallengeService, installChallengeRoutes, EXECUTION_TTL } = require('./challenges.cjs');
const { readJson, json } = require('./router.cjs');
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
function createMissionService(options) {
  const service=createChallengeService(options);
  return {...service,list:service.legacyList,listChallenges:service.list};
}
function installMissionRoutes(router, sessions) {
  const service = createMissionService();
  installChallengeRoutes(router,sessions,{...service,list:service.listChallenges});
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
