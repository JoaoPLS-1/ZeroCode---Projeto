const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {createApp} = require('./server/app.cjs');
const Progress = require('./engine/progress.js');
const content = require('./server/data/omega.cjs');
async function verify() {
  const server = createApp();
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  const base = 'http://127.0.0.1:' + server.address().port;
  let cookie;
  async function call(path, body, status = 200) {
    const response = await fetch(base + '/api/jogo/' + path, {
      method:body === undefined ? 'GET' : 'POST',
      headers:{'Content-Type':'application/json', ...(cookie ? {Cookie:cookie} : {})},
      ...(body === undefined ? {} : {body:JSON.stringify(body)})
    });
    assert.equal(response.status, status);
    if (response.headers.has('set-cookie')) cookie = response.headers.get('set-cookie').split(';')[0];
    return response.json();
  }
  const event = {chave:'evento:omega-encontrada', sala:'room_secret'};
  try {
    await call('eventos', event, 401);
    await call('decisao/acesso', undefined, 401);
    await call('omega', undefined, 401);
    await call('nova-partida', {});
    assert.equal((await call('decisao/acesso')).liberada, false);
    await call('omega', undefined, 403);
    await call('eventos', event, 403);
    await call('porta-secreta', {ip:'10.19.56.7', porta:2017});
    assert.equal((await call('decisao/acesso')).liberada, false, 'Abrir a porta não é encontrar ÔMEGA');
    await call('eventos', {...event, sala:'room_meeting'}, 403);
    const first = await call('eventos', event);
    assert(first.nova); assert.deepEqual(first.cena, content.cena);
    const repeated = await call('eventos', event);
    assert.equal(repeated.nova, false); assert(!repeated.cena);
    assert.equal(repeated.progresso.filter(key => key === event.chave).length, 1);
    assert.equal((await call('decisao/acesso')).liberada, true);
    assert.deepEqual((await call('omega')).dialogo, content.console);
    const originalCookie = cookie; cookie = undefined;
    await call('nova-partida', {});
    assert.equal((await call('decisao/acesso')).liberada, false);
    await call('eventos', event, 403);
    cookie = originalCookie; await call('nova-partida', {});
    assert.equal((await call('decisao/acesso')).liberada, false);
    await call('eventos', event, 403);
    await call('porta-secreta', {ip:'10.19.56.7', porta:2017});
    assert.equal((await call('eventos', event)).nova, true);
    assert.equal((await fetch(base + '/server/data/omega.cjs')).status, 404);
    console.log('ÔMEGA / servidor: autorização, decisão bloqueada antes do encontro, cena única, console, isolamento, nova partida e conteúdo privado aprovados.');
  } finally { await new Promise(resolve => server.close(resolve)); }

  let calls = 0, scenes = 0, decisions = 0, fail = false;
  const progress = new Progress();
  const g = {state:'playing', map:{id:'room_secret'}, progress, input:{}, hud:{showPrompt(){}},
    _lockInteractions(){}, _showClueAlert(){this.alerted=true;}, _showResult(){},
    dialogue:{isActive(){return this.active;}, open(def, cb){this.active=true;this.def=def;this.onComplete=cb;if(def===content.cena)scenes++;},
      close(done=true){this.active=false;const cb=this.onComplete;this.onComplete=null;if(done)cb?.();}, continueEl:{}},
    mission:{isActive(){return false;}, open(){decisions++;}}};
  const api = {
    async post(){calls++;if(fail)throw new Error('Sem conexão');const nova=!progress.has('evento:omega-encontrada');progress.sincronizar({progresso:['acesso:sala-secreta','evento:omega-encontrada']});return {nova,cena:content.cena};},
    async get(path){return path.endsWith('/omega') ? {dialogo:content.console,chamar:content.chamar} : {liberada:progress.has('evento:omega-encontrada'),dialogo:content.bloqueada};}
  };
  const scope = vm.createContext({module:{exports:{}}, api});
  vm.runInContext(fs.readFileSync('engine/omega.js','utf8'), scope);
  const flow = new scope.module.exports(g);
  await flow.decide();assert.equal(decisions,0);assert.equal(g.dialogue.def,content.bloqueada);g.dialogue.close();
  await flow.enter();assert.equal(calls,0);
  progress.sincronizar({progresso:['acesso:sala-secreta']});
  fail=true;await flow.enter();assert(g.alerted);assert.equal(g.state,'playing');assert.equal(scenes,0);
  fail=false;const pending=flow.enter();await flow.enter();await pending;assert.equal(scenes,1);g.dialogue.close();
  await flow.enter();assert.equal(scenes,1);
  await flow.console();assert.equal(g.dialogue.def,content.console);assert.equal(g.dialogue.continueEl.textContent,content.chamar);
  g.dialogue.close();await new Promise(setImmediate);assert.equal(decisions,1);
  await flow.console();g.dialogue.close(false);assert.equal(decisions,1,'Esc não chama a decisão');
  progress.sincronizar({progresso:['acesso:sala-secreta']});await flow.enter();assert.equal(scenes,2);
  console.log('ÔMEGA / cliente: bloqueio, cena única por partida, falha de rede, envio duplicado, repetição da fala, chamar D.A.N.I.E.L. e Esc aprovados.');

  // Exercita os pontos reais de entrada do Game, sem substituir seu encaminhamento.
  const Game = require('./engine/game.js');
  const integrated = Object.create(Game.prototype);
  let entries=0, consoles=0, gates=0;
  integrated.omega={enter(){entries++;},console(){consoles++;},decide(){gates++;}};
  integrated.map={id:'room_secret'};integrated._lockInteractions=()=>{};
  integrated._transitionEl={style:{},classList:{add(){}},querySelector:()=>({})};
  integrated._roomTransition={phase:'in',elapsed:0,fadeIn:0.1};
  integrated._updateRoomTransition(0.1);assert.equal(entries,1);
  integrated._updateRoomTransition(0.1);assert.equal(entries,1);
  integrated._interactWith({type:'computer_final'});assert.equal(gates,1);
  integrated._interactWith({type:'omega_console'});assert.equal(consoles,1);
  assert(fs.readFileSync('index.html','utf8').includes('src="engine/omega.js"'));

  const dialogueScope=vm.createContext({module:{exports:{}},document:{activeElement:null}});
  vm.runInContext(fs.readFileSync('engine/dialogue.js','utf8'),dialogueScope);
  const dialogue=Object.create(dialogueScope.module.exports.prototype);
  const node=()=>({classList:{toggle(){},add(){},remove(){}},focus(){}});
  Object.assign(dialogue,{root:node(),nameEl:node(),textEl:node(),continueEl:node(),speakerBadgeEl:node(),playerSpriteEl:node(),npcSpriteEl:node(),supportsPortraits:false,
    _setPresentation(cinematic){assert.equal(cinematic,false,'ÔMEGA deve usar o terminal sem retratos');}});
  dialogue.open(content.cena);assert.equal(dialogue.nameEl.textContent,'ÔMEGA');
  dialogue.close(false);assert(dialogue.active,'Esc não pode perder a cena única');
  dialogue.advance();dialogue.advance();dialogue.advance();
  assert.equal(dialogue.nameEl.textContent,'KAEL (pensa)');
  assert.equal(dialogue.textEl.textContent,'Eu perdi a memória. Eles perderam o hábito de olhar.');
  dialogue.advance();assert.equal(dialogue.active,false);
  console.log('ÔMEGA / integração: cena após transição, terminal e console encaminhados, script carregado, apresentação investigation sem retrato e pensamento de Kael aprovados.');
}
verify().catch(error => {console.error(error);process.exitCode=1;});
