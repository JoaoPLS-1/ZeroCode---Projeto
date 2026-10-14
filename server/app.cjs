const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { createHash } = require('node:crypto');
const { createRouter, readJson, json } = require('./router.cjs');
const { createSessions } = require('./sessions.cjs');
const { installMissionRoutes } = require('./missions.cjs');
const progress = require('./progress.cjs');
const { installVfsRoutes } = require('./vfs.cjs');
const { installFlagRoutes } = require('./flags.cjs');
const { installCaptureRoutes } = require('./capture.cjs');
const { installSecretDoorRoutes } = require('./secret-door.cjs');
const { installPerguntaRoutes } = require('./perguntas.cjs');
const { installRepoRoutes } = require('./repo.cjs');
const { installPipelineRoutes } = require('./pipeline.cjs');
const { installDecisionRoutes } = require('./decision.cjs');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC_FILES = new Set(['/index.html', '/style.css', '/main.js']);
const PUBLIC_DIRS = new Set(['assets', 'data', 'engine', 'ui']);
const MIME = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};
// Único atributo style inserido via HTML pelo painel de controles atual.
const CONTROL_STYLE_HASH = createHash('sha256').update('margin-top:0').digest('base64');
const CSP = `default-src 'self'; script-src 'self'; style-src 'self'; style-src-attr 'unsafe-hashes' 'sha256-${CONTROL_STYLE_HASH}'; img-src 'self' data:; font-src 'self'; worker-src 'self'; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'`;
// O laboratório compila o corpo JS do jogador apenas dentro do Worker.
const WORKER_CSP = "default-src 'none'; script-src 'self' 'unsafe-eval'; connect-src 'none'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'";

function safePath(url) {
  const pathname = (url || '').split('?')[0];
  if (!pathname.startsWith('/') || /[%\\\x00-\x1f\x7f:#]/.test(pathname)) return null;
  const segments = pathname.split('/').slice(1);
  if (segments.some(s => s === '.' || s === '..') || pathname.includes('//')) return null;
  return pathname === '/' ? '/index.html' : pathname;
}

async function serveStatic(req, res, pathname) {
  const parts = pathname.slice(1).split('/');
  const ext = path.extname(pathname).toLowerCase();
  const allowed = PUBLIC_FILES.has(pathname) || (PUBLIC_DIRS.has(parts[0]) && parts.length > 1);
  if (!allowed || !MIME[ext] || parts.some(s => s.startsWith('.'))) return json(res, 404, { ok: false, erro: 'Arquivo não encontrado.' });
  const filename = path.join(ROOT, ...parts);
  // Rejeitar links também impede aliases públicos para arquivos privados.
  try {
    let current = ROOT;
    for (const part of parts) {
      current = path.join(current, part);
      if ((await fs.promises.lstat(current)).isSymbolicLink()) return json(res, 404, { ok: false, erro: 'Arquivo não encontrado.' });
    }
    if (!(await fs.promises.stat(filename)).isFile()) return json(res, 404, { ok: false, erro: 'Arquivo não encontrado.' });
    if (!['GET', 'HEAD'].includes(req.method)) {
      res.setHeader('Allow', 'GET, HEAD');
      return json(res, 405, { ok: false, erro: 'Método não permitido.' });
    }
    const content = await fs.promises.readFile(filename);
    if (pathname === '/engine/code-worker.js') res.setHeader('Content-Security-Policy', WORKER_CSP);
    res.writeHead(200, { 'Content-Type': MIME[ext], 'Content-Length': content.length });
    res.end(req.method === 'HEAD' ? undefined : content);
  } catch {
    json(res, 404, { ok: false, erro: 'Arquivo não encontrado.' });
  }
}

function createApp() {
  const sessions = createSessions();
  const router = createRouter();
  installMissionRoutes(router, sessions);
  progress.installProgressRoutes(router, sessions);
  installVfsRoutes(router, sessions);
  installFlagRoutes(router, sessions);
  installCaptureRoutes(router, sessions);
  installSecretDoorRoutes(router, sessions);
  installPerguntaRoutes(router, sessions);
  installRepoRoutes(router, sessions);
  installPipelineRoutes(router, sessions);
  installDecisionRoutes(router, sessions);
  router.add('POST', '/api/jogo/nova-partida', async (req, res) => {
    await readJson(req);
    const session = sessions.get(req);
    if (session) sessions.reset(session); else sessions.create(res);
    json(res, 200, { ok: true });
  });
  router.add('GET', '/api/jogo/estado', (req, res) => {
    const session = sessions.get(req);
    if (!session) return json(res, 401, { ok: false, erro: 'Inicie uma nova partida.' });
    json(res, 200, { ok: true, ...progress.state(session) });
  });
  return http.createServer(async (req, res) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'no-referrer');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Content-Security-Policy', CSP);
    const pathname = safePath(req.url);
    if (!pathname) return json(res, 404, { ok: false, erro: 'Caminho não encontrado.' });
    if (pathname === '/api' || pathname.startsWith('/api/')) return router.handle(req, res, pathname);
    await serveStatic(req, res, pathname);
  });
}

module.exports = { createApp };
