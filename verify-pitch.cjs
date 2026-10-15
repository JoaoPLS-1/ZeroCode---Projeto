const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const chapters = require('./server/data/pitch.cjs');
const Pitch = require('./engine/pitch.js');
const { ROOMS } = require('./data/maps.js');
const objects = require('./data/objects.js');
const npcs = require('./data/npcs.js');
const Collision = require('./engine/collision.js');
const expected = [[], ['flag:retry-C'], ['flag:pagamento-C','mem:pagamento-C'],
  ['retry-C','pagamento-C','crachas-C','mural-C','upload-C'].flatMap(id=>['flag:'+id,'mem:'+id]).concat(['evento:senha-lembrada','app:wireshark']),
  ['acesso:sala-secreta'], ['acesso:sala-secreta','evento:omega-encontrada']];

async function verify() {
  assert.equal(chapters.length,6);
  for(const [i,chapter] of chapters.entries()) {
    assert.deepEqual(chapter.progresso,expected[i]);
    const room=ROOMS[chapter.sala];assert.ok(room);
    assert.ok(Number.isFinite(chapter.spawn.x)&&Number.isFinite(chapter.spawn.y));
    assert.ok(chapter.spawn.x>=room.bounds.x&&chapter.spawn.y>=room.bounds.y);
    assert.ok(chapter.spawn.x<room.bounds.x+room.bounds.width&&chapter.spawn.y<room.bounds.y+room.bounds.height);
    const collision=new Collision(room);collision.obstacles=[...collision.obstacles,...npcs.filter(n=>n.roomId===chapter.sala)];
    assert.ok(collision.isValidPosition({x:chapter.spawn.x-14,y:chapter.spawn.y-9,width:28,height:18}),chapter.titulo+': spawn sobre obstáculo');
    if(chapter.acao.startsWith('abrir-'))assert.equal(objects.find(o=>o.id===chapter.acao.split(':')[1]).roomId,chapter.sala);
  }
  const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
  const base='http://127.0.0.1:'+app.address().port;
  let cookie;
  async function call(path,body,status=200) {
    const response=await fetch(base+'/api/jogo/'+path,{method:body===undefined?'GET':'POST',
      headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
      ...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
    assert.equal(response.status,status,path);
    if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];
    return response.json();
  }
  try {
    await call('pitch/capitulo/1',{},403);
    for(const modo of ['completo','rapido']) {
      await call('nova-partida',{modo});await call('pitch/capitulo/1',{},403);
      assert.deepEqual((await call('estado')).progresso,[]);
    }
    await call('nova-partida',{modo:'pitch'});
    const pitchCookie=cookie;
    for(const n of [1,2,3,4,5,6,3,1,6,4,2]) {
      const result=await call('pitch/capitulo/'+n,{}),chapter=chapters[n-1];
      assert.deepEqual(result.progresso,expected[n-1]);
      assert.equal(result.capitulo,n);assert.equal(result.total,6);assert.equal(result.modo,'pitch');
      for(const key of ['titulo','legenda','sala','spawn','acao'])assert.deepEqual(result[key],chapter[key]);
      assert.equal('captura' in result,n===3);
      if(n===3){assert.equal(result.captura.nova,true);assert.match(result.captura.flag.ficha,/servidor/);assert.ok(result.captura.flag.lembranca);}
      assert.deepEqual((await call('estado')).progresso,expected[n-1]);
      const flags=await call('flags');assert.equal(flags.flags.length,expected[n-1].filter(k=>k.startsWith('flag:')).length);
      assert.equal(flags.lembrancas,expected[n-1].filter(k=>k.startsWith('mem:')).length);
      if(n===2){const station=await call('desafios?estacao=computer_dev_left');assert.ok(station.desafios.some(d=>d.id==='pagamento-validar'));}
      if(n===4)assert.equal((await call('captura?estacao=computer_infra_upper')).pacotes.length,50);
      else await call('captura?estacao=computer_infra_upper',undefined,403);
    }
    for(const n of ['0','7','-1','1.5','NaN','abc','01','1e0']) {
      await call('pitch/capitulo/'+n,{},400);assert.deepEqual((await call('estado')).progresso,expected[1]);
    }
    await call('pitch/capitulo/6',{});
    await call('decisao',{escolhas:{omega:'isolar',deploy:'rollback',processo:'revisao'}});
    assert.ok((await call('decisao/acesso')).resultado);
    await call('pitch/capitulo/6',{});assert.equal((await call('decisao/acesso')).resultado,undefined);
    await call('pitch/capitulo/5',{});
    const encounter=await call('eventos',{chave:'evento:omega-encontrada',sala:'room_secret'});
    assert.equal(encounter.nova,true);assert.equal(encounter.cena.npcName,'ÔMEGA');
    await call('pitch/capitulo/1',{});assert.deepEqual((await call('estado')).progresso,[]);
    // Uma outra sessão continua sem acesso aos presets e sem conteúdo privado.
    cookie=undefined;await call('nova-partida',{modo:'completo'});
    await call('pitch/capitulo/4',{},403);assert.deepEqual((await call('estado')).progresso,[]);
    cookie=pitchCookie;assert.deepEqual((await call('estado')).progresso,[]);
    await call('nova-partida',{modo:'completo'});await call('pitch/capitulo/1',{},403);
    for(const path of ['/server/data/pitch.cjs','/server/pitch.cjs'])assert.equal((await fetch(base+path)).status,404);
  } finally { await new Promise(resolve=>app.close(resolve)); }
  console.log('Pitch HTTP: 6 capítulos, presets exatos, reset, captura/ficha, 50 pacotes, ÔMEGA, decisão, 400/403, isolamento e arquivos privados aprovados.');

  const pitch=Object.create(Pitch.prototype);pitch.g={modo:'pitch',state:'playing'};pitch.chapter=3;
  let selected,visibility=0;pitch.go=n=>{selected=n;};pitch.renderVisibility=()=>visibility++;
  const press=(code,editing=false,extra={})=>{
    selected=undefined;let prevented=false;
    pitch.keydown({code,target:{closest:()=>editing},preventDefault(){prevented=true;},stopImmediatePropagation(){},...extra});return prevented;
  };
  for(const key of ['ArrowRight','PageDown','KeyN']){assert.equal(press(key),true);assert.equal(selected,4);}
  for(const key of ['ArrowLeft','PageUp','KeyB']){assert.equal(press(key),true);assert.equal(selected,2);}
  for(let n=1;n<=6;n++){press('Digit'+n);assert.equal(selected,n);}
  press('KeyH');assert.equal(pitch.hidden,true);press('KeyH');assert.equal(pitch.hidden,false);assert.equal(visibility,2);
  assert.equal(press('Escape'),false);assert.equal(press('KeyN',true),false);assert.equal(press('ArrowRight',true),false);
  press('PageDown',true);assert.equal(selected,4);
  press('KeyN',false,{repeat:true});assert.equal(selected,undefined);
  pitch.g.modo='completo';assert.equal(press('KeyN'),false);
  pitch.g.modo='pitch';pitch.g.state='start';assert.equal(press('Digit1'),false);
  console.log('Pitch teclado: navegação, saltos 1–6, H, Esc preservado, edição, passador e isolamento do modo aprovados.');

  const scope=vm.createContext({});vm.runInContext(fs.readFileSync('engine/computer.js','utf8').split('const zeroTerminal=')[0]+'\nglobalThis.Computer=ZeroComputer;',scope);
  let rendered,launched=false;
  const computer=Object.create(scope.Computer.prototype);computer.stationChallenges=[{id:'pagamento-validar'}];computer.c={};
  computer.owner={panel:{querySelector:()=>({})},launchTrace(){launched=true;}};
  computer.renderMission=()=>{rendered=computer.selectedId;};
  computer.selectChallenge('pagamento-validar');assert.equal(rendered,'pagamento-validar');assert.equal(launched,true);
  assert.throws(()=>computer.selectChallenge('inexistente'));
  console.log('Pitch ZeroTrace: seleção explícita do pagamento e rejeição de desafio indisponível aprovadas.');

  const actions=[];const status={};
  const computerMock={record:()=>({}),open:station=>actions.push('pc:'+station.id),ready:Promise.resolve(),selectChallenge:id=>actions.push('desafio:'+id)};
  const presentation=Object.create(Pitch.prototype);
  presentation.bar={querySelector:()=>status};presentation.failed=error=>{throw error;};
  presentation.g={allObjects:objects,dialogsData:{dialog_opening:{}},_lockInteractions(){},
    dialogue:{open:()=>actions.push('abertura')},case:{computer:computerMock,panel:{querySelector:()=>({click:()=>actions.push('apenas-selecionou'),_osLaunch:()=>actions.push('wireshark')})}},
    flagsUI:{update:()=>actions.push('flag')},_omegaEncounter:()=>({enter:async()=>actions.push('omega'),decide:async()=>actions.push('decisao')})};
  for(const chapter of chapters){presentation.busy=true;await presentation.run(chapter);assert.equal(presentation.busy,false);}
  assert.deepEqual(actions,['abertura','pc:computer_dev_left','desafio:pagamento-validar','flag','pc:computer_infra_upper','wireshark','omega','decisao']);
  const gameScope=vm.createContext({});vm.runInContext(fs.readFileSync('engine/game.js','utf8')+'\nglobalThis.Game=Game;',gameScope);
  const game=Object.create(gameScope.Game.prototype);let automaticOmega=0,completed=0;
  game.map={id:'room_secret'};game._transitionEl={classList:{add(){}},style:{},querySelector:()=>({})};game._lockInteractions=()=>{};
  game._omegaEncounter=()=>({enter:()=>automaticOmega++});
  game._roomTransition={phase:'in',elapsed:0,fadeIn:.1,onComplete:()=>completed++};
  game._updateRoomTransition(.2);assert.equal(completed,1);assert.equal(automaticOmega,0);assert.equal(game.state,'playing');
  game._roomTransition={phase:'in',elapsed:0,fadeIn:.1};game._updateRoomTransition(.2);assert.equal(automaticOmega,1);
  console.log('Pitch integração: spawns sem colisão, seis ações, espera do editor, transição com callback e encontro normal preservado aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
