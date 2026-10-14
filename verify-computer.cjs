const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const missions=require('./data/code-missions');
const {missions:privateMissions}=require('./server/data/missions.cjs');
const {createMissionService,EXECUTION_TTL}=require('./server/missions.cjs');
const workerSource=fs.readFileSync('engine/code-worker.js','utf8');
function execute(source,entradas){
 let result;
 const scope=vm.createContext({self:{postMessage:r=>result=r},structuredClone});
 vm.runInContext(workerSource,scope);scope.data={source,entradas};
 vm.runInContext('self.onmessage({data})',scope,{timeout:300});
 return JSON.parse(JSON.stringify(result));
}
const solutions=[
 'return input.status === 503 && input.attempt < 3;',
 'const e=input.find(e=>e.type==="deploy"); return e ? e.time : null;',
 'return input.filter(t=>t.status==="SKIP").map(t=>t.name);',
 'return Math.min(8000,1000*2**input);',
 'return {rollback: input.retries>100 && input.externalTraffic==="baseline", isolate:input.retries>100};'
];
const fresh=()=>({progresso:[],gameOver:false});
let time=1000;
const service=createMissionService({now:()=>time});
const submit=(session,id,execution,source)=>{
 const answer=execute(source,execution.entradas);
 return service.submit(session,id,execution.execucao,answer.erro?{saidas:execution.entradas.map(()=>null),erro:answer.erro}:answer);
};
const status=(fn,code)=>assert.throws(fn,error=>error.status===code);
function solvePrevious(session,index){
 for(let i=0;i<index;i++){
  const result=submit(session,missions[i].id,service.start(session,missions[i].id),solutions[i]);
  assert(result.ok);assert(service.unlock(session,missions[i+1].id,{senha:result.senha}).ok);
 }
}

async function verify(){
 for(const [i,m] of missions.entries()){
  assert(!('tests' in m));assert(!('reward' in m));
  const session=fresh();solvePrevious(session,i);
  const execution=service.start(session,m.id),wrong=submit(session,m.id,execution,m.starter);
  assert(!wrong.ok,m.id+' código inicial aprovado');assert.equal(wrong.erros,1);
  for(const test of wrong.resultados)assert.equal('esperado' in test,!test.passou);
  assert(!('senha' in wrong));assert(!('recompensa' in wrong));
  status(()=>submit(session,m.id,execution,solutions[i]),409);
  const result=submit(session,m.id,service.start(session,m.id),solutions[i]);
  assert(result.ok,m.id);assert.equal(result.erros,1);assert(!result.gameOver);
  assert(result.resultados.every(t=>t.passou&&!('esperado' in t)));
  assert.equal(result.recompensa,privateMissions[i].reward);
  assert(session.progresso.includes('clue:'+privateMissions[i].clueRef));
  status(()=>service.start(session,m.id),409);
  const listed=service.list(session).missoes[i];assert(listed.resolvida);assert.equal(listed.senha,result.senha);
  if(i<missions.length-1){
   assert(!service.unlock(session,missions[i+1].id,{senha:'ERRADA'}).ok);
   assert(service.list(session).missoes[i+1].bloqueada);
   assert(service.unlock(session,missions[i+1].id,{senha:result.senha}).ok);
   assert(!service.list(session).missoes[i+1].bloqueada);
  }
 }
 const id=missions[0].id,session=fresh();
 status(()=>service.start(session,'desconhecida'),404);
 status(()=>service.start(session,missions[1].id),403);
 assert(!service.unlock(session,missions[1].id,{senha:'ERRADA'}).ok);
 for(const senha of [null,42,'x'.repeat(33)])status(()=>service.unlock(session,missions[1].id,{senha}),400);
 const expiring=service.start(session,id);time+=EXECUTION_TTL;
 status(()=>submit(session,id,expiring,solutions[0]),409);assert.equal(service.list(session).missoes[0].erros,0);
 const replaced=service.start(session,id),active=service.start(session,id);
 status(()=>submit(session,id,replaced,solutions[0]),409);
 for(const body of [null,{}, {saidas:'texto'}, {saidas:[]}, {saidas:active.entradas.map(()=>false),erro:22}]){
  status(()=>service.submit(session,id,active.execucao,body),400);
 }
 assert.equal(service.list(session).missoes[0].erros,0);
 assert(!submit(session,id,active,'return ; syntax ?').ok);
 assert(!submit(session,id,service.start(session,id),'throw new Error("falha");').ok);
 const third=submit(session,id,service.start(session,id),missions[0].starter);
 assert(third.gameOver);assert.equal(third.erros,3);
 status(()=>service.start(session,id),409);status(()=>service.unlock(session,id,{senha:''}),409);
 for(let i=0;i<missions.length;i++){
  const replaySession=fresh();solvePrevious(replaySession,i);
  const previous=service.start(replaySession,missions[i].id),memorized=execute(solutions[i],previous.entradas);
  const next=service.start(replaySession,missions[i].id);
  assert.notDeepEqual(next.entradas,previous.entradas);
  assert(!service.submit(replaySession,missions[i].id,next.execucao,memorized).ok,'Saídas decoradas aprovadas: '+missions[i].id);
 }
 assert(execute('return ; syntax ?',[{}]).erro);
 assert(execute('throw new Error("erro");',[{}]).erro);
 assert.deepEqual(execute('return undefined;',[{}]),{saidas:[null]});
 assert.deepEqual(execute('return {x:input.x+1};',[{x:1}]),{saidas:[{x:2}]});
 assert.deepEqual(execute('return [typeof self.XMLHttpRequest,typeof self.WebSocket,typeof self.importScripts];',[{}]).saidas,[['undefined','undefined','undefined']]);
 assert.throws(()=>execute('while(true){}',[{}]),/timed out/);
 console.log('Código/servidor: cinco soluções, códigos iniciais recusados, entradas aleatórias, comparação, erros, game over no 3º, execução única/expirada, replay recusado, senhas, recompensas e progresso aprovados.');
 await verifyClient();
}

async function verifyClient(){
 const tick=()=>new Promise(resolve=>setImmediate(resolve));
 class Case {terminal(){}close(){this.closed=true;}}
 const nodes=new Map(),node=s=>{if(!nodes.has(s))nodes.set(s,{value:solutions[0],textContent:'',disabled:false,focus(){}});return nodes.get(s);};
 class Worker {
  constructor(){Worker.current=this;}postMessage(data){this.data=data;}terminate(){this.stopped=true;}
  respond(result=execute(this.data.source,this.data.entradas)){this.onmessage({data:result});}
 }
 let currentSession=fresh(),timeoutCallback,afterSubmit=null;
 const api={
  async get(path){assert.equal(path,'/api/jogo/missoes');return service.list(currentSession);},
  async post(path,body){
   const parts=path.split('/'),id=parts[4];
   if(parts[5]==='desbloquear')return service.unlock(currentSession,id,body);
   if(parts.length===6)return service.start(currentSession,id);
   const result=service.submit(currentSession,id,parts[6],JSON.parse(JSON.stringify(body)));
   if(afterSubmit)await afterSubmit();
   return result;
  }
 };
 const scope=vm.createContext({CaseExperience:Case,CODE_MISSIONS:missions,Worker,api,setTimeout:fn=>{timeoutCallback=fn;return 1;},clearTimeout(){},clearInterval(){},location:{reload(){}},console});
 vm.runInContext(fs.readFileSync('engine/computer.js','utf8')+'\nglobalThis.ZeroComputer=ZeroComputer;',scope);
 const found=new Set(),owner=new Case();
 Object.assign(owner,{panel:{querySelector:node},solved:new Set(),errors:0,g:{state:'case',clues:{addClue:id=>found.add(id),getState:()=>({})},hud:{update(){}}}});
 const create=async()=>{const pc=owner.computer=new scope.ZeroComputer(owner);pc.c={id:missions[0].id};await pc.sync();return pc;};
 let pc=await create(),r=pc.record(pc.c.id);
 assert.equal(pc.record(missions[1].id).unlocked,false);assert(!r.password);
 for(const mission of missions){const state=pc.record(mission.id);assert.notEqual(state.folder,state.tutorialFolder);assert.equal(pc.record(mission.id).tutorialFolder,state.tutorialFolder);}
 await pc.run();assert.equal(pc.worker,null,'Precisa ler instruções');r.read=true;
 let running=pc.run();await tick();assert(pc.worker);assert.equal(await pc.run(),undefined,'Execução duplicada bloqueada');
 const cancelledWorker=Worker.current;pc.stop();await running;assert.equal(r.errors,0,'Cancelar não consome tentativa');
 node('.code-editor').value=missions[0].starter;
 running=pc.run();await tick();cancelledWorker.respond({saidas:[]});assert(pc.worker,'Resposta antiga não encerra o novo Worker');Worker.current.respond();await running;
 assert.equal(r.errors,1);assert(node('.code-output').textContent.includes('esperado'));
 await pc.sync();assert.equal(r.errors,1,'Consulta mantém erros');
 running=pc.run();await tick();timeoutCallback();await running;assert.equal(r.errors,2);
 running=pc.run();await tick();Worker.current.respond({erro:'SyntaxError: inválido'});await running;
 assert.equal(r.errors,3);assert(pc.dead);assert.equal(owner.g.state,'gameover');owner.close();assert(!owner.closed);
 currentSession=fresh();pc=await create();r=pc.record(pc.c.id);r.read=true;node('.code-editor').value=solutions[0];
 running=pc.run();await tick();Worker.current.respond();await running;
 assert(r.solved);assert(found.has(privateMissions[0].clueRef));assert(owner.solved.has(missions[0].id));assert(r.password);
 await pc.run();assert.equal(pc.worker,null);
 currentSession=fresh();found.clear();owner.solved.clear();pc=await create();r=pc.record(pc.c.id);r.read=true;
 let release;afterSubmit=()=>new Promise(resolve=>{release=resolve;});
 running=pc.run();await tick();Worker.current.respond();await tick();pc.stop();release();await running;
 assert(!r.solved,'Resposta após fechar PC não altera UI');afterSubmit=null;
 await pc.sync();assert(r.solved,'Reabrir consulta conquista confirmada pelo servidor');
 assert(found.has(privateMissions[0].clueRef));assert(owner.solved.has(missions[0].id));
 console.log('Worker/cliente: transformação sem gabarito, isolamento, sintaxe, loop infinito, leitura, cancelamento, clique duplicado, erros persistentes, timeout, recompensa, game over e resposta após fechamento aprovados.');
}

verify().catch(error=>{console.error(error);process.exitCode=1;});
