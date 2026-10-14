const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { cesar } = require('./engine/os/apps/cesar.js');
const { VFS_FILES, generateNexusLog } = require('./server/data/vfs.cjs');
const { createTerminal } = require('./engine/os/terminal-core.js');
const RemoteFS = require('./engine/os/vfs.js');
const { createApp } = require('./server/app.cjs');
const OBJECTS = require('./data/objects.js');

async function verify() {
  const plain = 'O SERVIDOR QUE DORME AINDA FALA. VEJA O INVENTARIO.';
  const cipher = 'R VHUYLGRU TXH GRUPH DLQGD IDOD. YHMD R LQYHQWDULR.';
  assert.equal(cesar(plain, 3), cipher);assert.equal(cesar(cipher, -3), plain);
  assert.equal(cesar('Abc XYZ 2017! é, ç.', -3), 'Xyz UVW 2017! é, ç.');
  assert.equal(cesar('Zz Aa', 1), 'Aa Bb');
  for (let n = -52; n <= 52; n++) assert.equal(cesar(cesar('Kael, 02:14! áéç', n), -n), 'Kael, 02:14! áéç');
  assert.throws(() => cesar('a', 1.5), TypeError);
  const content = VFS_FILES['/var/log/nexus.log'].content, log = content.split('\n');
  assert.equal(content, generateNexusLog());assert.equal(log.length, 2400);
  assert.equal(log[2016], '02:21:17 WARN  [kernel] ' + cipher);
  assert.equal(cesar(log[2016].split('[kernel] ')[1], -3), plain);
  assert.equal(log.filter(line => line.includes(cipher)).length, 1);
  assert(log[0].startsWith('02:00:00'));assert(log.at(-1).startsWith('02:30:00'));
  assert(log[1679].startsWith('02:14:00 INFO  [release] Deploy v2.1'));
  for (let i = 1; i < log.length; i++) assert(log[i].slice(0, 8) >= log[i - 1].slice(0, 8));
  assert(!log.slice(0, 1680).some(line => line.includes('503')));
  const attempts = log.filter(line => line.includes('tentativas internas=')).map(line => Number(line.match(/internas=(\d+)/)[1]));
  assert.equal(attempts[0], 2);assert.equal(attempts.at(-1), 4096);
  for (let i = 1; i < attempts.length; i++) assert(attempts[i] >= attempts[i - 1]);
  const inventory = VFS_FILES['/srv/infra/inventario.csv'].content;
  assert.equal(inventory.split('\n').length, 13);
  assert(inventory.includes('srv-legado-07,10.19.56.7,batch noturno,DESATIVADO,2023-03'));
  assert(inventory.includes('10.0.2.15'));assert(inventory.includes('10.0.3.20'));
  console.log('Cifra/log: ida e volta, negativos, pontuação, 2.400 linhas determinísticas, linha 2017, deploy 02:14, retries crescentes e inventário aprovados.');

  // DOM mínimo: garante texto seguro, resultado ao vivo e limites dos controles.
  class Element {
    constructor() { this.children = [];this.value = '';this.classList = { add() {} }; }
    set innerHTML(value) { throw new Error('Não interpretar o texto como HTML.'); }
    append(...children) { this.children.push(...children); }
    replaceChildren(...children) { this.children = children; }
    setAttribute(name, value) { this[name] = value; }
  }
  let definition;
  const scope = vm.createContext({ registerZeroApp: def => { definition = def; }, document: { createElement: () => new Element() } });
  vm.runInContext(fs.readFileSync('engine/os/apps/cesar.js', 'utf8'), scope);
  assert.equal(definition.id, 'cesar');assert.equal(definition.availableAt, '*');
  const body = new Element();definition.open({ window: { body } });
  const [, sourceLabel, controls, outputLabel, mapping] = body.children;
  const source = sourceLabel.children[0], output = outputLabel.children[0];
  const [minus, shiftLabel, plus] = controls.children, shift = shiftLabel.children[0];
  assert.equal(shift.children.length, 51);assert.equal(shift.value, '0');assert(output.readOnly);
  source.value = cipher;source.oninput();assert.equal(output.value, cipher);
  shift.value = '-3';shift.onchange();assert.equal(output.value, plain);
  assert.equal(mapping.children[0].children[1].children[1].textContent, 'X');
  plus.onclick();assert.equal(output.value, cesar(cipher, -2));minus.onclick();assert.equal(output.value, plain);
  shift.value = '-25';shift.onchange();assert(minus.disabled);minus.onclick();assert.equal(shift.value, '-25');
  shift.value = '25';shift.onchange();assert(plus.disabled);plus.onclick();assert.equal(shift.value, '25');
  source.value = '<script>2017</script>';source.oninput();assert.equal(output.value, cesar(source.value, 25));
  console.log('Roda de César: registro global, seletor −25/+25, botões limitados, resultado ao vivo, alfabeto e texto seguro aprovados.');

  const app = createApp();await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + app.address().port;
  try {
    const initial = await fetch(base + '/api/jogo/nova-partida', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
    const cookie = initial.headers.get('set-cookie').split(';')[0];
    const api = { async get(path) {
      const response = await fetch(base + path, { headers: { Cookie: cookie } }), result = await response.json();
      if (!response.ok) throw new Error(result.erro);return result;
    } };
    const allowed = ['computer_qa_infra_lower', 'computer_infra_upper', 'computer_dev_right'];
    for (const station of OBJECTS.filter(o => ['computer', 'computer_final'].includes(o.type)).map(o => o.id)) {
      const remote = new RemoteFS(api, station);
      assert.equal((await remote.read('/var/log/nexus.log')).content, content);
      if (allowed.includes(station)) {
        assert.equal((await remote.read('/srv/infra/inventario.csv')).content, inventory);
        assert((await remote.list('/srv/infra')).entries.some(entry => entry.name === 'inventario.csv'));
      } else {
        for (const operation of [() => remote.read('/srv/infra/inventario.csv'), () => remote.list('/srv/infra')])
          await assert.rejects(operation, /Arquivo não encontrado/);
        await assert.rejects(() => remote.list('/srv'), /Arquivo não encontrado/);
      }
    }
    const term = createTerminal(new RemoteFS(api, 'computer_infra_upper'));
    assert.deepEqual((await term.run('grep -n 2017 /var/log/nexus.log')).lines, [], 'grep não seleciona por número de linha');
    assert.deepEqual((await term.run("sed -n '2017p' /var/log/nexus.log")).lines, [log[2016]]);
    assert.deepEqual((await term.run("sed -n '2016,2018p' /var/log/nexus.log")).lines, log.slice(2015, 2018));
    assert.match((await term.run('sed 2017p /var/log/nexus.log')).lines[0], /uso/);
    assert.deepEqual((await term.run('grep 2017 /var/log/nexus.log')).lines, []);
    const cat = (await term.run('cat /var/log/nexus.log')).lines;
    assert.equal(cat.length, 201);assert.deepEqual(cat.slice(0, 200), log.slice(0, 200));assert(cat.at(-1).includes('use grep, less ou sed'));
    assert.deepEqual((await term.run('less /var/log/nexus.log 11')).lines.slice(0, 200), log.slice(2000, 2200));
    assert((await term.run('less /var/log/nexus.log 13')).lines[0].includes('fora do intervalo'));
    assert((await term.run('less /var/log/nexus.log 0')).lines[0].includes('uso:'));
    assert.deepEqual((await term.run('cat /srv/infra/inventario.csv')).lines, inventory.split('\n'));
    const state = await api.get('/api/jogo/estado');assert(state.progresso.includes('file:inventario'));
    assert.equal(state.contagem.flags, 0);
    const boundary = createTerminal({ resolve: async (cwd, name) => name, read: async name => ({ content: Array(Number(name)).fill('linha').join('\n') }) });
    assert.equal((await boundary.run('cat 500')).lines.length, 500);assert.equal((await boundary.run('cat 501')).lines.length, 201);
    assert.equal((await fetch(base + '/engine/os/apps/cesar.js')).status, 200);
    for (const path of ['/server/data/vfs.cjs', '/verify-cifra-log.cjs']) assert.equal((await fetch(base + path)).status, 404);
    const index = await (await fetch(base)).text();assert(index.indexOf('engine/os/apps.js') < index.indexOf('engine/os/apps/cesar.js'));
    console.log('Cifra HTTP/Terminal: log em todos os PCs, inventário restrito às três estações, sed -n 2017p, cat limitado, less paginado, progresso no servidor e dados privados aprovados.');
  } finally { await new Promise(resolve => app.close(resolve)); }
}
verify().catch(error => { console.error(error);process.exitCode = 1; });
