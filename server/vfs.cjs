const { VFS_FILES } = require('./data/vfs.cjs');
const progress = require('./progress.cjs');
const { json } = require('./router.cjs');
const OBJECTS = require('../data/objects.js');
const stations = new Set(OBJECTS.filter(o => o.type === 'computer' || o.type === 'computer_final').map(o => o.id));

function resolve(cwd, entrada) {
  if (typeof cwd !== 'string' || typeof entrada !== 'string') throw new TypeError('Caminho inválido.');
  if (entrada === '~' || entrada.startsWith('~/')) entrada = '/home/kael' + entrada.slice(1);
  const parts = [];
  for (const part of (entrada.startsWith('/') ? entrada : cwd + '/' + entrada).split('/')) {
    if (part === '..') parts.pop();
    else if (part && part !== '.') parts.push(part);
  }
  return '/' + parts.join('/');
}
function visible(session, station, file) {
  return stations.has(station) && progress.requires(session, file.requires) &&
    (file.stations === undefined || file.stations.includes(station));
}
function list(session, station, caminho) {
  const path = resolve('/', caminho), prefix = path === '/' ? '/' : path + '/';
  const entries = new Map();
  for (const [filename, file] of Object.entries(VFS_FILES)) {
    if (!filename.startsWith(prefix) || !visible(session, station, file)) continue;
    const rest = filename.slice(prefix.length), name = rest.split('/')[0], directory = rest.includes('/');
    entries.set(name, { name, path: prefix + name, type: directory ? 'directory' : 'file',
      ...(directory ? {} : { size: file.size, modified: file.modified }) });
  }
  if (!entries.size) return null;
  return { caminho: path, entries: [...entries.values()].sort((a, b) => a.name.localeCompare(b.name)) };
}
function read(session, station, caminho) {
  const path = resolve('/', caminho), file = VFS_FILES[path];
  if (!file || !visible(session, station, file)) return null;
  progress.set(session, 'file:' + file.id);
  for (const key of file.grants || []) progress.set(session, key);
  return { caminho: path, id: file.id, content: file.content, size: file.size, modified: file.modified };
}
function installVfsRoutes(router, sessions) {
  for (const [route, operation] of [['lista', list], ['arquivo', read]]) {
    router.add('GET', '/api/jogo/fs/' + route, (req, res) => {
      const session = sessions.get(req);
      if (!session) return json(res, 401, { ok: false, erro: 'Inicie uma nova partida.' });
      const params = new URL(req.url, 'http://localhost').searchParams;
      const station = params.get('estacao'), caminho = params.get('caminho');
      const result = stations.has(station) && caminho !== null ? operation(session, station, caminho) : null;
      if (!result) return json(res, 404, { ok: false, erro: 'Arquivo não encontrado.' });
      json(res, 200, { ok: true, ...result, ...(operation === read ? progress.state(session) : {}) });
    });
  }
}

module.exports = { resolve, list, read, installVfsRoutes };
