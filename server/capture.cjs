const { pacotes } = require('./data/capture.cjs');
const progress = require('./progress.cjs');
const { json } = require('./router.cjs');
const capturaPermitida = (session, estacao) => estacao === 'computer_infra_upper' || (session.modo === 'rapido' && estacao === 'computer_dev_left');
function installCaptureRoutes(router, sessions) {
  router.add('GET', '/api/jogo/captura', (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res, 401, { ok:false, erro:'Inicie uma nova partida.' });
    const estacao = new URL(req.url, 'http://localhost').searchParams.get('estacao');
    if (!progress.has(session, 'app:wireshark') || !capturaPermitida(session, estacao))
      return json(res, 403, { ok:false, erro:'Captura indisponível nesta estação ou sem autenticação.' });
    session.capturaAberta = true;
    json(res, 200, { ok:true, pacotes });
  });
}
module.exports = { installCaptureRoutes, capturaPermitida };
