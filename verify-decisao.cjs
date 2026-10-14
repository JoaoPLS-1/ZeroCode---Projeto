const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const definition = require('./data/missions.js');
const {evaluate} = require('./server/decision.cjs');
const {createApp} = require('./server/app.cjs');
const {createSessions} = require('./server/sessions.cjs');
const choices = {omega:'isolar',deploy:'rollback',processo:'revisao'};
async function verify(){
 // 27 combinações em sete contagens, incluindo acima da meta de cinco.
 for(const omega of definition.choices[0].options)for(const deploy of definition.choices[1].options)for(const processo of definition.choices[2].options){
  const selected={omega:omega.id,deploy:deploy.id,processo:processo.id};
  const good=Number(omega.id==='isolar')+Number(deploy.id==='rollback')+Number(processo.id==='revisao');
  for(const flags of [0,1,2,3,4,5,16]){
   const result=evaluate({progresso:Array.from({length:flags},(_,i)=>'flag:'+i)},selected);
   const expected=good===3&&flags>=5?'S':(good===3&&flags>=1)||(good===2&&flags>=3)||(good===1&&flags>=5)?'A':'B';
   assert.equal(result.rank,expected);assert.equal(result.flags,flags);assert.equal(result.body.length,6);
   for(const [i,label] of ['ÔMEGA','Deploy 2.1','Processo'].entries())assert(result.body[i+1].startsWith(label+':'));
  }
 }
 console.log('Decisão / notas: 27 combinações × 7 contagens de flags, S/A/B e explicação de cada escolha aprovados.');
 const sessions=createSessions();const session=sessions.create({setHeader(){}});session.decisao={rank:'S'};sessions.reset(session);assert.equal(session.decisao,null);
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;let cookie;
 async function call(path,body,status=200){
  const response=await fetch(base+'/api/jogo/'+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  assert.equal(response.status,status);if(response.headers.has('set-cookie'))cookie=response.headers.get('set-cookie').split(';')[0];return response.json();
 }
 try{
  await call('decisao',{escolhas:choices},401);await call('nova-partida',{});
  assert(!(await call('decisao/acesso')).resultado);await call('decisao',{escolhas:choices},403);
  await call('porta-secreta',{ip:'10.19.56.7',porta:2017});await call('decisao',{escolhas:choices},403);
  await call('eventos',{chave:'evento:omega-encontrada',sala:'room_secret'});
  for(const invalid of [null,{},[],{omega:'isolar'},{...choices,omega:'x'},{...choices,rank:'S'},{...choices,deploy:3}])await call('decisao',{escolhas:invalid},400);
  // Campos de nota/flags do cliente não influenciam o resultado.
  const result=await call('decisao',{escolhas:choices,flags:99,rank:'S'});assert.equal(result.resultado.rank,'B');assert.equal(result.resultado.flags,0);
  assert.deepEqual((await call('decisao/acesso')).resultado,result.resultado);
  await call('decisao',{escolhas:choices},409);
  const first=cookie;cookie=undefined;await call('nova-partida',{});assert(!(await call('decisao/acesso')).resultado);await call('decisao',{escolhas:choices},403);
  cookie=first;await call('nova-partida',{});await call('decisao',{escolhas:choices},403);
  await call('porta-secreta',{ip:'10.19.56.7',porta:2017});await call('eventos',{chave:'evento:omega-encontrada',sala:'room_secret'});
  const concurrent=await Promise.all([200,409].map(()=>fetch(base+'/api/jogo/decisao',{method:'POST',headers:{Cookie:cookie,'Content-Type':'application/json'},body:JSON.stringify({escolhas:choices})})));
  assert.deepEqual(concurrent.map(r=>r.status).sort(),[200,409]);
  assert.equal((await fetch(base+'/server/decision.cjs')).status,404);
  const publicData=await (await fetch(base+'/data/missions.js')).text();assert(!/correctOption|results:|const best|explanations/.test(publicData));
 }finally{await new Promise(resolve=>server.close(resolve));}
 console.log('Decisão / HTTP: sessão, encontro obrigatório, entradas inválidas, nota/flags forjadas ignoradas, decisão única concorrente, recuperação, isolamento, reset e referência privada aprovados.');
 class Element{
  constructor(){this.children=[];this.nodes={};this.dataset={};this.attrs={};this.classes=new Set();this.classList={add:n=>this.classes.add(n),remove:n=>this.classes.delete(n),contains:n=>this.classes.has(n),toggle:(n,on)=>on?this.classes.add(n):this.classes.delete(n)};}
  set innerHTML(value){this.children=[];this.nodes={};}setAttribute(k,v){this.attrs[k]=v;}append(...nodes){this.children.push(...nodes);}focus(){}
  querySelector(s){if(s==='button')return this.children[0];if(s==='.nexus-back'){const back=this.nodes['.nexus-actions']?.children.find(n=>n.className==='nexus-back');if(back)return back;}return this.nodes[s]??=new Element();}querySelectorAll(){return Object.values(this.nodes);}
 }
 let posts=0,fail=false,recover=false,release;
 const stored=evaluate({progresso:[]},choices);
 const api={post:async(path,body)=>{assert.equal(path,'/api/jogo/decisao');assert.deepEqual(JSON.parse(JSON.stringify(body.escolhas)),choices);posts++;if(fail)throw new Error('Sem conexão');await new Promise(resolve=>release=resolve);return {resultado:stored};},get:async()=>recover?{resultado:stored}:{}};
 const scope=vm.createContext({module:{exports:{}},document:{activeElement:new Element(),createElement:()=>new Element()},window:{matchMedia:()=>({matches:true})},clearInterval(){},api});
 vm.runInContext(fs.readFileSync('engine/mission.js','utf8'),scope);
 const root=new Element(),mission=new scope.module.exports(root,definition);let results=0;
 mission.open((finished,result)=>{assert(finished);assert.equal(result,stored);results++;});
 await mission._choose();assert.equal(posts,0);
 for(let i=0;i<3;i++){mission.optionsEl.children[0].onclick();if(i<2)root.querySelector('.nexus-confirm').onclick();}
 root.querySelector('.nexus-back').onclick();assert.equal(mission.step,1);assert.equal(mission.selected.deploy,'rollback');root.querySelector('.nexus-confirm').onclick();
 const pending=mission._choose();await mission._choose();mission.close();assert(mission.active);assert.equal(posts,1);release();await pending;assert.equal(results,1);assert(!mission.active);await mission._choose();assert.equal(posts,1);
 mission.open(()=>results++);mission.selected={...choices};fail=true;await mission._choose();assert(mission.active);assert(!mission.submitting);assert.equal(root.querySelector('.nexus-speech').textContent,'Sem conexão');
 recover=true;await mission._choose();assert(!mission.active);assert.equal(results,2);
 const Game=require('./engine/game.js');const game=Object.create(Game.prototype);let restarted=0;
 game.dom={resultButton:{dataset:{replay:'1'}},resultScreen:{}};game._newSession=()=>restarted++;game._onResultButtonClick();assert.equal(restarted,1);
 console.log('Decisão / cliente: três etapas, seleção preservada, confirmação incompleta/duplicada bloqueada, erro de rede, recuperação de resultado e jogar novamente aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
