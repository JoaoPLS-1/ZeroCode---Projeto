const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const RemoteFS = require('./engine/os/vfs.js');
const { createTerminal, registerTerminalCommand } = require('./engine/os/terminal-core.js');

function memoryFS() {
  const resolve = new RemoteFS({}).resolve.bind(new RemoteFS({}));
  const grants = new Set(), reads = [];
  const files = {
    '/home/kael/leia-me.txt': { content: 'Leia os logs.\nTexto <img src=x onerror=alert(1)>', grants: ['file:leia-me', 'clue:teste'] },
    '/var/log/nexus.log': { content: '02:13 Antes\n02:14 deploy v2\n02:14 DEPLOY V2\nLiteral a.b\nLiteral axb' },
    '/srv/equipe/contatos.txt': { content: 'Equipe', requires: 'file:leia-me' },
    '/home/kael/arquivo com espaços.txt': { content: 'Aspas funcionam' },
  };
  const visible = () => Object.entries(files).filter(([, file]) => !file.requires || grants.has(file.requires));
  const missing = () => { throw new Error('Arquivo não encontrado.'); };
  return { grants, reads, resolve,
    async list(path) {
      const prefix = path === '/' ? '/' : path + '/', entries = new Map();
      for (const [name] of visible()) {
        if (!name.startsWith(prefix)) continue;
        const rest = name.slice(prefix.length), first = rest.split('/')[0];
        entries.set(first, { name: first, path: prefix + first, type: rest.includes('/') ? 'directory' : 'file' });
      }
      if (!entries.size) missing();
      return { caminho: path, entries: [...entries.values()] };
    },
    async read(path) {
      const file = visible().find(([name]) => name === path)?.[1];
      if (!file) missing();
      reads.push(path);for (const grant of file.grants || []) grants.add(grant);
      return { caminho: path, content: file.content };
    },
  };
}
async function verify() {
  const remote = memoryFS(), term = createTerminal(remote);
  const lines = async command => (await term.run(command)).lines;
  assert.deepEqual(await lines('pwd'), ['/home/kael']);
  assert.deepEqual(await lines('ls'), ['leia-me.txt', 'arquivo com espaços.txt']);
  assert.deepEqual(await lines('ls /'), ['home/', 'var/']);
  assert.deepEqual(await lines('ls /srv'), ['ls: /srv: arquivo não encontrado']);
  assert.equal(remote.reads.length, 0);
  await term.run('cd ..');assert.deepEqual(await lines('pwd'), ['/home']);
  assert.deepEqual(await lines('ls ./kael'), ['leia-me.txt', 'arquivo com espaços.txt']);
  await term.run('cd /var/log');await term.run('cd .././log');assert.equal(term.cwd, '/var/log');
  await term.run('cd ../../../../..');assert.equal(term.cwd, '/');
  await term.run('cd');assert.equal(term.cwd, '/home/kael');
  await term.run('cd /var');await term.run('cd ~');assert.equal(term.cwd, '/home/kael');
  assert.deepEqual(await lines('cd leia-me.txt'), ['cd: leia-me.txt: não é um diretório']);
  assert.deepEqual(await lines('cd ausente'), ['cd: ausente: diretório não encontrado']);
  assert.equal(term.cwd, '/home/kael');assert.equal(remote.reads.length, 0);
  assert.deepEqual(await lines('cat /srv/equipe/contatos.txt'), ['cat: /srv/equipe/contatos.txt: arquivo não encontrado']);
  assert.deepEqual([...remote.grants], []);
  assert.deepEqual(await lines('cat leia-me.txt'), ['Leia os logs.', 'Texto <img src=x onerror=alert(1)>']);
  assert.deepEqual([...remote.grants], ['file:leia-me', 'clue:teste']);
  assert.deepEqual(await lines('ls /srv'), ['equipe/']);
  assert.deepEqual(await lines('cat /srv/equipe/contatos.txt'), ['Equipe']);
  assert.deepEqual(await lines('cat nao-existe.txt'), ['cat: nao-existe.txt: arquivo não encontrado']);
  assert.deepEqual(await lines('cat /var/log'), ['cat: /var/log: é um diretório']);
  assert.deepEqual(await lines('ls leia-me.txt'), ['leia-me.txt']);
  assert.deepEqual(await lines('cat "arquivo com espaços.txt"'), ['Aspas funcionam']);
  assert.deepEqual(await lines("cat 'arquivo com espaços.txt'"), ['Aspas funcionam']);
  assert.deepEqual(await lines('grep "deploy v2" /var/log/nexus.log'), ['02:14 deploy v2']);
  assert.deepEqual(await lines("grep -i 'deploy v2' /var/log/nexus.log"), ['02:14 deploy v2', '02:14 DEPLOY V2']);
  assert.deepEqual(await lines('grep -n 02:14 /var/log/nexus.log'), ['2:02:14 deploy v2', '3:02:14 DEPLOY V2']);
  assert.deepEqual(await lines('grep -n -i "deploy v2" /var/log/nexus.log'), ['2:02:14 deploy v2', '3:02:14 DEPLOY V2']);
  assert.deepEqual(await lines('grep a.b /var/log/nexus.log'), ['Literal a.b']);
  assert.deepEqual(await lines('grep ausente /var/log/nexus.log'), []);
  assert.deepEqual(await lines('grep -x texto arquivo'), ['grep: opção inválida: -x']);
  assert.deepEqual(await lines('cat'), ['cat: uso: cat <arquivo>']);
  assert.deepEqual(await lines('cat "aspas'), ['aspas não fechadas']);
  assert.deepEqual(await lines('inexistente'), ['inexistente: comando não encontrado']);
  assert.deepEqual(await lines('constructor'), ['constructor: comando não encontrado']);
  assert.deepEqual(await lines('   '), []);
  assert.deepEqual(await lines('whoami'), ['kael']);
  assert.deepEqual(await term.run('clear'), { lines: [], clear: true });
  registerTerminalCommand('teste', { help: 'teste — extensão', run: async (args, terminal) => ({ lines: [args[0], terminal.cwd] }) });
  assert.deepEqual(await lines('teste futuro'), ['futuro', '/home/kael']);
  assert((await lines('help')).includes('teste — extensão'));
  assert.throws(() => registerTerminalCommand('teste', {}));
  const offline = createTerminal({ resolve: remote.resolve, list: async () => { throw new Error('Não foi possível conectar ao servidor.'); } });
  assert.deepEqual((await offline.run('cd /var')).lines, ['Não foi possível conectar ao servidor.']);
  assert.equal(offline.cwd, '/home/kael');
  console.log('Terminal: caminhos relativos, .., ~, cd/ls/pwd, cat com grants, grep literal (-n/-i), aspas, erros, clear e extensão aprovados.');

  // Confirma o contrato de teclado existente sem modificar o InputManager.
  const handlers = {}, scope = vm.createContext({ window: { addEventListener: (name, fn) => { handlers[name] = fn; } }, module: { exports: {} } });
  vm.runInContext(fs.readFileSync('engine/input.js', 'utf8'), scope);
  const input = new scope.module.exports();
  for (const code of ['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyJ', 'KeyM', 'KeyE']) {
    handlers.keydown({ code, target: { matches: () => true } });assert.equal(input.wasJustPressed(code), false);
  }
  handlers.keydown({ code: 'Escape', target: { matches: () => true } });assert.equal(input.wasJustPressed('Escape'), true);
  console.log('Teclado: digitação em input não ativa movimento/dossiê/mapa/interação; Esc permanece disponível.');

  // DOM mínimo: falha se o app tentar interpretar conteúdo como HTML.
  class Element {
    constructor() { this.children = [];this.value = '';this.isConnected = true;this.classList = { add() {} }; }
    set innerHTML(value) { throw new Error('O Terminal não deve usar innerHTML.'); }
    set textContent(value) { this.text = value;this.children = []; }
    get textContent() { return (this.text || '') + this.children.map(child => child.textContent).join(''); }
    append(...children) { this.children.push(...children); }
    prepend(child) { this.children.unshift(child); }
    setAttribute() {} addEventListener() {} focus() {} setSelectionRange() {}
  }
  let definition;
  const ui = vm.createContext({ createTerminal, registerZeroApp: def => { definition = def; }, document: {
    createElement: () => new Element(), createTextNode: text => { const el = new Element();el.textContent = text;return el; },
  } });
  vm.runInContext(fs.readFileSync('engine/os/apps/terminal.js', 'utf8'), ui);
  assert.equal(definition.id, 'terminal');assert.equal(definition.availableAt, '*');
  const body = new Element();definition.open({ fs: memoryFS(), station: { id: 'computer_dev_left' }, window: { body, el: new Element() } });
  const [output, form] = body.children, prompt = form.children[0], field = prompt.children[1];
  assert.equal(output.children.length, 2);assert(output.textContent.includes('digite help'));
  assert(prompt.textContent.includes('kael@computer_dev_left:/home/kael$'));
  const submit = async value => { field.value = value;await form.onsubmit({ preventDefault() {} }); };
  await submit('cat leia-me.txt');assert(output.textContent.includes('<img src=x onerror=alert(1)>'));
  await submit('pwd');field.value = 'rascunho';
  field.onkeydown({ key: 'ArrowUp', preventDefault() {} });assert.equal(field.value, 'pwd');
  field.onkeydown({ key: 'ArrowUp', preventDefault() {} });assert.equal(field.value, 'cat leia-me.txt');
  field.onkeydown({ key: 'ArrowDown', preventDefault() {} });assert.equal(field.value, 'pwd');
  field.onkeydown({ key: 'ArrowDown', preventDefault() {} });assert.equal(field.value, 'rascunho');
  let prevented = false;field.onkeydown({ key: 'Tab', preventDefault() { prevented = true; } });assert(prevented);
  prevented = false;field.onkeydown({ key: 'Escape', preventDefault() { prevented = true; } });assert(!prevented);
  await submit('cd /var/log');assert(prompt.textContent.includes(':/var/log$'));
  await submit('clear');assert.equal(output.textContent, '');assert.equal(field.readOnly, false);
  console.log('Interface: boas-vindas, prompt atualizado, histórico ↑/↓ com rascunho, Tab retido, Esc livre, textContent e clear aprovados.');

  // Roteiro com servidor real: valida publicação dos scripts e progresso via leitura.
  const { createApp } = require('./server/app.cjs');
  const app = createApp();await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.address().port;
  try {
    const response = await fetch(base + '/api/jogo/nova-partida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    assert.equal(response.status, 200);const cookie = response.headers.get('set-cookie').split(';')[0];
    const client = new RemoteFS({ async get(path) {
      const response = await fetch(base + path, { headers: { Cookie: cookie } }), result = await response.json();
      if (!response.ok) throw new Error(result.erro);return result;
    } }, 'computer_dev_left');
    const live = createTerminal(client);
    assert((await live.run('help')).lines.some(line => line.startsWith('grep ')));
    assert.deepEqual((await live.run('ls')).lines, ['leia-me.txt']);
    assert.deepEqual((await live.run('ls /srv')).lines, ['ls: /srv: arquivo não encontrado']);
    await live.run('cat leia-me.txt');assert.deepEqual((await live.run('ls /srv')).lines, ['equipe/']);
    const state = await (await fetch(base + '/api/jogo/estado', { headers: { Cookie: cookie } })).json();
    assert(state.progresso.includes('file:leia-me'));
    assert((await live.run('grep -n 02:14 /var/log/nexus.log')).lines.includes('12:02:14:08 Uma requisição gerou 4.096 tentativas'));
    for (const path of ['/engine/os/terminal-core.js', '/engine/os/apps/terminal.js']) assert.equal((await fetch(base + path)).status, 200);
    assert.equal((await fetch(base + '/verify-terminal.cjs')).status, 404);
    console.log('Terminal HTTP: scripts públicos, testes privados, leitura registrada no servidor, /srv liberado e log numerado aprovados.');
  } finally { await new Promise(resolve => app.close(resolve)); }
}
verify().catch(error => { console.error(error);process.exitCode = 1; });
