const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const modos = require('./server/data/modos.cjs');
const { capturar, listar } = require('./server/flags.cjs');
const progress = require('./server/progress.cjs');
const dialogs = require('./data/dialogs.js');

async function verify() {
  for (const [modo, config] of Object.entries(modos)) {
    const session = { modo, progresso:[] };
    assert.equal(listar(session).meta, config.metaLembrancas);
    for (const [index, id] of ['retry-C','provisoria-2','provisoria-3','provisoria-4','provisoria-5'].entries()) {
      const result = capturar(session, id);
      assert.equal(result.wiresharkLiberado, index + 1 === config.metaLembrancas);
      assert.equal('senhaLembrada' in result, result.wiresharkLiberado);
      assert.equal(progress.has(session, 'app:wireshark'), index + 1 >= config.metaLembrancas);
      assert.equal(capturar(session, id).wiresharkLiberado, false);
    }
    assert.equal(progress.count(session, 'evento:senha-lembrada'), 1);
  }
  console.log('Modos: metas 2/5/5, desbloqueio do Wireshark, lembrança e duplicatas aprovados.');

  const previousDev = process.env.ZC_DEV;
  let app;
  try { process.env.ZC_DEV = '1'; app = createApp(); }
  finally { if (previousDev === undefined) delete process.env.ZC_DEV; else process.env.ZC_DEV = previousDev; }
  await new Promise(resolve => app.listen(0, '127.0.0.1', resolve));
  let cookie;
  async function call(path, body, status = 200) {
    const response = await fetch('http://127.0.0.1:'+app.address().port+'/api/jogo/'+path, {
      method:body === undefined ? 'GET' : 'POST',
      headers:{'Content-Type':'application/json', ...(cookie ? { Cookie:cookie } : {})},
      ...(body === undefined ? {} : { body:JSON.stringify(body) }), signal:AbortSignal.timeout(10000)
    });
    assert.equal(response.status, status, path);
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return response.json();
  }
  try {
    await call('estado', undefined, 401);
    for (const input of [undefined, null, 'invalido', '__proto__', 'constructor', 2, {}, ['rapido'], 'rapido', 'pitch', 'completo']) {
      await call('nova-partida', { modo:input });
      const modo = typeof input === 'string' && Object.hasOwn(modos, input) ? input : 'completo';
      const state = await call('estado');
      assert.equal(state.modo, modo);
      assert.equal(state.metaLembrancas, modos[modo].metaLembrancas);
      assert.deepEqual(state.salas, modos[modo].salas);
      assert.deepEqual(state.progresso, []);
      assert.equal((await call('flags')).meta, modos[modo].metaLembrancas);
      for (const [index, id] of ['retry-C','provisoria-2'].entries()) {
        const result = await call('dev/flag', { id });
        assert.equal(result.captura.wiresharkLiberado, modo === 'rapido' && index === 1);
      }
      assert.equal((await call('estado')).progresso.includes('app:wireshark'), modo === 'rapido');
    }
    await call('nova-partida', {});
    assert.equal((await call('estado')).modo, 'completo');
    assert.equal((await call('flags')).lembrancas, 0);
  } finally { await new Promise(resolve => app.close(resolve)); }
  console.log('Modos por HTTP: validação, padrão completo, estado/salas/meta, captura e troca com reset aprovados.');

  let keydown, selected;
  const scope = vm.createContext({ window:{addEventListener(type, listener){keydown = listener;}} });
  vm.runInContext(fs.readFileSync('engine/game.js','utf8')+'\nglobalThis.Game = Game;', scope);
  const button = modo => ({ dataset:{modo}, addEventListener(type, fn){this.click = fn;} });
  const buttons = ['rapido','completo','pitch'].map(button);
  const game = Object.create(scope.Game.prototype);
  game.dom = {startScreen:{querySelectorAll:()=>buttons, querySelector:()=>buttons[2]},
    briefingButton:{addEventListener(){}},resultButton:{addEventListener(){}},
    completeScreen:{querySelector:()=>({addEventListener(){}})}};
  game._newSession = (callback, button, root, modo) => { selected = modo; };
  game._bindScreenButtons();
  for (const button of buttons) { button.click(); assert.equal(selected, button.dataset.modo); }
  game.state = 'start';
  keydown({code:'KeyP',preventDefault(){}});
  assert.equal(selected, 'pitch');
  selected = null; game.state = 'playing';
  keydown({code:'KeyP',preventDefault(){}}); assert.equal(selected, null);
  game.salasPermitidas = modos.rapido.salas; game.dialogsData = dialogs;
  let blocked = 0, secret = 0;
  game.dialogue = {open(def){assert.equal(def, dialogs.dialog_modo_bloqueado); blocked++;}};
  game.progress = {has:()=>false}; game.secretDoor = {open(){secret++;}};
  game._changeRoom('room_qa_infra');
  assert.equal(blocked, 1); assert.equal(game._roomTransition, undefined);
  game._changeRoom('room_secret'); assert.equal(secret, 1);
  game.salasPermitidas = '*';
  let destination;
  game.roomManager = {getRoom(id){destination = id;return null;}};
  game._changeRoom('room_qa_infra'); assert.equal(destination, 'room_qa_infra');

  const { HUD, Minimap } = require('./engine/hud.js');
  const hud = {memoryEl:{}};
  HUD.prototype.setLembrancas.call(hud, 0, 2);
  HUD.prototype.setLembrancas.call(hud, 1);
  assert.equal(hud.memoryEl.textContent, 'Lembranças 1/2');
  HUD.prototype.setLembrancas.call(hud, 0, 5);
  assert.equal(hud.memoryEl.textContent, 'Lembranças 0/5');
  const labels = [];
  const minimap = Object.create(Minimap.prototype);
  minimap.canvas = {width:600,height:507}; minimap.backgrounds = {};
  minimap.rooms = {room_dev:{name:'Dev',width:10,height:10},room_secret:{name:'Secreta',width:10,height:10},room_cafe:{name:'Café'}};
  minimap.layout = {room_dev:{x:0,y:0,w:10,h:10},room_secret:{x:0,y:10,w:10,h:10},room_cafe:{x:10,y:0,w:10,h:10}};
  minimap.ctx = {clearRect(){},fillRect(){},strokeRect(){},measureText:()=>({width:10}),fillText:label=>labels.push(label)};
  minimap.setSalas(modos.rapido.salas);
  assert.deepEqual(labels, ['DEV','SECRETA']);
  labels.length = 0; minimap.setSalas('*'); assert.deepEqual(labels, ['DEV','SECRETA','CAFÉ']);
  console.log('Interface: três seletores, atalho P apenas no início, porta bloqueada, acesso secreto preservado, caderno e minimapa por modo aprovados.');
}
verify().catch(error => { console.error(error); process.exitCode = 1; });
