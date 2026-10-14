const BODY_LIMIT = 64 * 1024;

function json(res, status, payload) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end(JSON.stringify(payload));
}

function failure(status, message) {
  return Object.assign(new Error(message), { status });
}

async function readJson(req) {
  if (Number(req.headers['content-length']) > BODY_LIMIT) {
    req.resume();
    throw failure(413, 'Corpo da requisição excede 64 KB.');
  }
  const chunks = [];
  let size = 0;
  // Não destruir o socket: o cliente precisa receber a resposta 413.
  await new Promise((resolve, reject) => {
    req.on('data', chunk => {
      size += chunk.length;
      if (size > BODY_LIMIT) {
        chunks.length = 0;
        reject(failure(413, 'Corpo da requisição excede 64 KB.'));
      } else chunks.push(chunk);
    });
    req.on('end', resolve);
    req.on('error', reject);
    req.on('aborted', () => reject(failure(400, 'Requisição interrompida.')));
  });
  if (!size) return {};
  if (req.headers['content-type']?.split(';')[0].trim().toLowerCase() !== 'application/json') {
    throw failure(415, 'Envie o corpo como application/json.');
  }
  try { return JSON.parse(Buffer.concat(chunks).toString('utf8')); }
  catch { throw failure(400, 'JSON inválido.'); }
}

function createRouter() {
  const routes = new Map();
  const patterns = [];
  return {
    addPattern(method, pattern, handler) { patterns.push({ method, pattern, handler }); },
    add(method, pathname, handler) {
      if (!routes.has(pathname)) routes.set(pathname, new Map());
      routes.get(pathname).set(method, handler);
    },
    async handle(req, res, pathname) {
      let methods = routes.get(pathname), params;
      if (!methods) {
        const matches = patterns.filter(route => route.pattern.test(pathname));
        if (matches.length) {
          methods = new Map(matches.map(route => [route.method, route.handler]));
          params = pathname.match(matches[0].pattern).slice(1);
        }
      }
      if (!methods) return json(res, 404, { ok: false, erro: 'Rota não encontrada.' });
      const handler = methods.get(req.method);
      if (!handler) {
        res.setHeader('Allow', [...methods.keys()].join(', '));
        return json(res, 405, { ok: false, erro: 'Método não permitido.' });
      }
      try { await handler(req, res, params); }
      catch (error) {
        if (!res.headersSent) json(res, error.status || 500, { ok: false, erro: error.status ? error.message : 'Erro interno do servidor.' });
        else res.end();
      }
    },
  };
}

module.exports = { createRouter, readJson, json, BODY_LIMIT };
