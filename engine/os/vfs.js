// Cliente do VFS: conteúdo e conquistas vêm exclusivamente do servidor.
class RemoteFS {
  constructor(api, estacao) { this.api = api; this.estacao = estacao; }
  async resolve(cwd, entrada) {
    if (typeof cwd !== 'string' || typeof entrada !== 'string') throw new TypeError('Caminho inválido.');
    if (entrada === '~' || entrada.startsWith('~/')) entrada = '/home/kael' + entrada.slice(1);
    const parts = [];
    for (const part of (entrada.startsWith('/') ? entrada : cwd + '/' + entrada).split('/')) {
      if (part === '..') parts.pop();
      else if (part && part !== '.') parts.push(part);
    }
    return '/' + parts.join('/');
  }
  async list(caminho = '/') { return this._get('lista', caminho); }
  async read(caminho) { return this._get('arquivo', caminho); }
  async _get(route, caminho) {
    const path = await this.resolve('/', caminho);
    return this.api.get('/api/jogo/fs/' + route + '?estacao=' + encodeURIComponent(this.estacao) + '&caminho=' + encodeURIComponent(path));
  }
}

if (typeof module !== 'undefined') module.exports = RemoteFS;
