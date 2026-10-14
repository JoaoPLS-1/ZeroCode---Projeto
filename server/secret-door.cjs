const progress = require('./progress.cjs');
const { readJson, json } = require('./router.cjs');
const ORIGIN_IP = '10.19.56.7';
const ORIGIN_PORT = 2017;

function installSecretDoorRoutes(router, sessions, { now = Date.now } = {}) {
  router.add('POST', '/api/jogo/porta-secreta', async (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res, 401, { ok:false, erro:'Inicie uma nova partida.' });
    const body = await readJson(req);
    if (!body || typeof body.ip !== 'string' || !/^(\d{1,3}\.){3}\d{1,3}$/.test(body.ip) ||
        body.ip.split('.').some(part => Number(part) > 255) ||
        !Number.isInteger(body.porta) || body.porta < 1 || body.porta > 65535)
      return json(res, 400, { ok:false, erro:'Informe um IP válido e uma porta inteira entre 1 e 65535.' });
    const time = now();
    session.portaSecretaTentativas = (session.portaSecretaTentativas || []).filter(t => time - t < 60000);
    if (session.portaSecretaTentativas.length >= 5) {
      res.setHeader('Retry-After', String(Math.max(1, Math.ceil((60000 - time + session.portaSecretaTentativas[0]) / 1000))));
      return json(res, 429, { ok:false, erro:'Muitas tentativas. Aguarde um minuto antes de tentar novamente.' });
    }
    session.portaSecretaTentativas.push(time);
    if (body.ip !== ORIGIN_IP || body.porta !== ORIGIN_PORT) return json(res, 200, { ok:false });
    progress.set(session, 'acesso:sala-secreta');
    json(res, 200, { ok:true, ...progress.state(session) });
  });
}

module.exports = { installSecretDoorRoutes };
