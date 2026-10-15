const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const { ROOMS } = require('./data/maps.js');
const dialogs = require('./data/dialogs.js');
const { cesar } = require('./engine/os/apps/cesar.js');

async function verify() {
 const app=createApp();let cookie;
 await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+app.address().port+'/api/jogo/';
 async function call(path,body,status=200){
  const response=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)}),signal:AbortSignal.timeout(10000)});
  const data=await response.json();assert.equal(response.status,status,path+': '+JSON.stringify(data));
  if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return data;
 }
 try {
  await call('nova-partida',{modo:'rapido'});
  assert.equal((await call('estado')).metaLembrancas,2);
  const capture='captura?estacao=computer_dev_left',repo='repo/prs/214';
  await call(capture,undefined,403);
  await call('omega',undefined,403);
  await call('decisao',{escolhas:{omega:'isolar',deploy:'rollback',processo:'revisao'}},403);
  for(const station of ['computer_dev_left','computer_dev_right'])assert.deepEqual((await call('desafios?estacao='+station)).desafios,[]);
  assert.deepEqual((await call('missoes')).missoes,[]);
  await call('missoes/computer_dev_left/execucao',{},404);
  await call('desafios/retry-teste/execucao',{},404);
  assert.equal((await call(repo+'/review?estacao=computer_dev_left',{linhas:[]})).ok,false);
  const {pr}=await call(repo+'?estacao=computer_dev_left');
  const lines=pr.diff.flatMap(file=>file.linhas).filter(line=>(line.tipo==='removida'&&(/\bif\s*\(attempt\s*>=/.test(line.texto)||/\bschedule\(/.test(line.texto)))||(line.tipo==='adicionada'&&/^\s*return retry\(attempt\s*\+\s*1\);/.test(line.texto))).map(line=>line.id);
  const review=await call(repo+'/review?estacao=computer_dev_left',{linhas:lines});
  assert(review.ok&&review.captura.nova);assert(review.progresso.includes('flag:retry-E'));
  assert.equal(review.contagem.lembrancas,1);await call(capture,undefined,403);
  assert.equal((await call(repo+'/review?estacao=computer_dev_left',{linhas:lines})).captura.nova,false);
  const questions=await call('perguntas');assert.deepEqual(questions.perguntas.map(q=>q.id),['cifra']);
  assert(!JSON.stringify(questions).includes('"resposta"'));assert(!JSON.stringify(questions).includes('cifra-R'));
  assert.equal((await call('perguntas/cifra',{resposta:'errada'})).ok,false);
  const decoded=cesar('R VHUYLGRU TXH GRUPH DLQGD IDOD.',-3);
  const answer=await call('perguntas/cifra',{resposta:decoded});
  assert(answer.ok&&answer.captura.nova&&answer.captura.wiresharkLiberado);
  assert(answer.progresso.includes('flag:cifra-R'));assert.equal(answer.contagem.lembrancas,2);
  assert.equal((await call('perguntas/cifra',{resposta:decoded})).captura.nova,false);
  const cards=await call('flags');assert.equal(cards.meta,2);assert.equal(cards.flags.length,2);assert(cards.flags.some(f=>f.conceito==='Criptografia básica'));
  const {pacotes}=await call(capture),suspect=pacotes.find(p=>p.protocolo==='TCP'&&p.payload.includes(':'));
  await call('eventos',{chave:'evento:batimento-visto',estacao:'computer_dev_right',pacote:suspect.n},403);
  assert((await call('eventos',{chave:'evento:batimento-visto',estacao:'computer_dev_left',pacote:suspect.n})).nova);
  assert.equal((await call('porta-secreta',{ip:'0.0.0.0',porta:1})).ok,false);
  assert((await call('porta-secreta',{ip:suspect.origem,porta:suspect.portaDestino})).ok);
  await call('omega',undefined,403);
  assert((await call('eventos',{chave:'evento:omega-encontrada',sala:'room_secret'})).cena);
  assert((await call('omega')).dialogo);assert((await call('decisao/acesso')).liberada);
  const decision=await call('decisao',{escolhas:{omega:'isolar',deploy:'rollback',processo:'revisao'}});
  assert(decision.ok&&decision.progresso.includes('evento:decisao-tomada'));
  await call('nova-partida',{modo:'rapido'});
  assert.equal((await call('flags')).lembrancas,0);
  const first=await call('perguntas/cifra',{resposta:decoded});assert.equal(first.contagem.lembrancas,1);await call(capture,undefined,403);
  const second=await call(repo+'/review?estacao=computer_dev_left',{linhas:lines});assert(second.captura.wiresharkLiberado);await call(capture);
  console.log('Rápido / HTTP: review → cifra → duas lembranças → captura no Dev 1 → batimento → porta → ÔMEGA → decisão aprovados; erros, duplicatas e missões ocultas verificados.');
  for(const modo of ['completo','pitch']){
   await call('nova-partida',{modo});assert(!(await call('perguntas')).perguntas.some(q=>q.id==='cifra'));
   await call('perguntas/cifra',{resposta:decoded},404);
   await call(capture,undefined,403);
  }
  await call('nova-partida',{modo:'completo'});
  for(const [id,resposta] of [['historico','7f2'],['pagamento','REQ-7F2-0412']])await call('perguntas/'+id,{resposta});
  await call(repo+'/review?estacao=computer_dev_left',{linhas:lines});
  const pipeline=await call('pipeline?estacao=computer_qa_upper');await call('pipeline',{yaml:pipeline.yaml.replace(/allow_failure: true/g,'allow_failure: false')});
  const execution=await call('missoes/computer_dev_left/execucao',{});
  const outputs=execution.entradas.map(input=>input.status===503&&input.attempt<3);
  assert((await call('missoes/computer_dev_left/execucao/'+execution.execucao,{saidas:outputs})).ok);
  assert((await call('estado')).progresso.includes('app:wireshark'));
  await call(capture,undefined,403);
  await call('captura?estacao=computer_infra_upper');
  await call('eventos',{chave:'evento:batimento-visto',estacao:'computer_dev_left',pacote:suspect.n},403);
  console.log('Rápido / isolamento: cifra ausente no Completo/Pitch; captura e evento recusados no Dev 1 fora do Rápido, inclusive com Wireshark liberado.');
 } finally { await new Promise(resolve=>app.close(resolve)); }

 const Game=require('./engine/game.js'),g=Object.create(Game.prototype);
 g.modo='rapido';g.map=ROOMS.room_dev;g.allNpcs=[];g.allObjects=[];g.collision={setMap(){}};g.renderer={setMap(){}};g.camera={setMapSize(){}};g.interaction={setContainers(){}};g.minimap={update(){}};g.roomManager={visited:[]};
 g._syncRoomSystems();assert.equal(g.activeContainers.find(d=>d.id==='door_dev_right').targetRoom,'room_secret');
 assert.equal(g.activeContainers.find(d=>d.id==='door_dev_left').targetRoom,'room_qa_infra');
 g.map=ROOMS.room_secret;g._syncRoomSystems();assert.equal(g.activeContainers[0].targetRoom,'room_dev');
 g.modo='completo';g.map=ROOMS.room_dev;g._syncRoomSystems();assert.equal(g.activeContainers.find(d=>d.id==='door_dev_right').targetRoom,'room_cafe');
 const scope=vm.createContext({document:{hidden:false},module:{exports:{}}});vm.runInContext(fs.readFileSync('engine/game.js','utf8'),scope);
 const hints=Object.create(scope.module.exports.prototype);let shown=0;
 Object.assign(hints,{modo:'rapido',state:'playing',dialogsData:dialogs,progress:{has:()=>false},dialogue:{isActive:()=>false,open(def){shown++;assert(def.lines[0].text.includes('PR #214'));}},input:{isInteractPressed:()=>false},mission:{isActive:()=>true},hud:{showPrompt(){}}});
 hints._update(44);assert.equal(shown,0);hints._update(1);assert.equal(shown,1);
 hints.modo='completo';hints._update(60);assert.equal(shown,1);
 console.log('Rápido / cliente: portas condicionais e retorno sem alterar os mapas originais; dica aos 45 s somente no Rápido aprovados.');
 verifyDesktop();
}

function verifyDesktop(){
 class Element {
  constructor(){this.children=[];this.dataset={};this.attrs={};this.isConnected=true;this.classList={add(){},remove(){}};}
  append(...items){for(const item of items){item.parent=this;this.children.push(item);}}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(item=>item!==this);this.isConnected=false;}
  setAttribute(key,value){this.attrs[key]=value;}
  querySelectorAll(selector){return this.children.filter(item=>selector==='button'||(selector==='[data-zero-app]'&&item.dataset.zeroApp));}
 }
 let launched=0,restored=0,locked=0;
 class Computer {constructor(owner){this.owner=owner;}open(){}}
 const scope=vm.createContext({document:{createElement:()=>new Element()},Game:class{},ZeroComputer:Computer,RemoteFS:class{},api:{}});
 vm.runInContext(fs.readFileSync('engine/case.js','utf8')+'\nthis.Experience=CaseExperience;',scope);
 vm.runInContext(fs.readFileSync('engine/os/apps.js','utf8')+'\nthis.apps=ZERO_APPS;',scope);
 vm.runInContext(fs.readFileSync('engine/os/apps/wireshark.js','utf8'),scope);
 vm.runInContext(fs.readFileSync('engine/os/apps/git.js','utf8'),scope);
 vm.runInContext(fs.readFileSync('engine/os/apps/cesar.js','utf8'),scope);
 for(const app of scope.apps){app.open=()=>{launched++;};if(app.openLocked)app.openLocked=()=>{locked++;};}
 function desktop(modo,station,unlocked){
  const nav=new Element(),start=new Element(),desktop=new Element(),shortcut=new Element();nav.append(shortcut);
  const owner={g:{modo,progress:{requires:cond=>!cond||unlocked,on:()=>()=>{}}},closeStartMenu(){},refreshDesktop(){},osMenuEvents:{signal:{aborted:false,addEventListener(){}}},
   panel:{querySelector(selector){return {'.zero-launchers':nav,'.pc-start-apps':start,'.pc-desktop':desktop,'.pc-shortcut':shortcut}[selector];}},
   windowManager:{windows:new Map(),restore(){restored++;},open({id}){const api={el:new Element(),body:new Element()};this.windows.set(id,{api});return api;}}};
  owner.setupDesktopApps=()=>scope.Experience.prototype.setupDesktopApps.call(owner);
  new Computer(owner).open({id:station});return {nav,start,owner};
 }
 const rapido=desktop('rapido','computer_dev_left',false);
 assert(!rapido.nav.children.some(icon=>!icon.dataset.zeroApp));
 const wire=rapido.nav.children.find(icon=>icon.dataset.zeroApp==='wireshark');assert(wire);
 assert(rapido.nav.children.some(icon=>icon.dataset.zeroApp==='git'));
 assert(rapido.nav.children.some(icon=>icon.dataset.zeroApp==='cesar'));
 wire.onclick();assert.equal(locked,0);assert.equal(wire.attrs['aria-pressed'],'true');
 wire.ondblclick();assert.equal(locked,1);wire._osLaunch();assert.equal(restored,1);
 const enabled=desktop('rapido','computer_dev_left',true),icon=enabled.nav.children.find(item=>item.dataset.zeroApp==='wireshark');
 icon.onclick();assert.equal(launched,0);icon._osLaunch();assert.equal(launched,1);
 assert(!desktop('completo','computer_dev_left',true).nav.children.some(item=>item.dataset.zeroApp==='wireshark'));
 assert(desktop('completo','computer_infra_upper',true).nav.children.some(item=>item.dataset.zeroApp==='wireshark'));
 console.log('Rápido / desktop: Git, César e Wireshark no Dev 1; ZeroTrace ausente; clique simples seleciona, duplo clique e _osLaunch abrem/restauram; bloqueio e disponibilidade por modo aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
