const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const {challenges,createChallengeService,EXECUTION_TTL}=require('./server/challenges.cjs');
const {createApp}=require('./server/app.cjs');
const {createSessions}=require('./server/sessions.cjs');
const {flags}=require('./server/data/flags.cjs');
const worker=fs.readFileSync('engine/code-worker.js','utf8');
function execute(source,entradas){
 let result;const scope=vm.createContext({self:{postMessage:value=>result=value},structuredClone});
 vm.runInContext(worker,scope);scope.data={source,entradas};vm.runInContext('self.onmessage({data})',scope,{timeout:500});
 return JSON.parse(JSON.stringify(result));
}
const fresh=()=>({progresso:[],gameOver:false});
const status=(fn,code)=>assert.throws(fn,error=>error.status===code);
const seeded=seed=>()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0x100000000;};
function format(){
 assert.equal(challenges.length,fs.readdirSync('server/data/challenges').filter(name=>name.endsWith('.cjs')).length);
 for(const c of challenges){
  for(const key of ['id','caso','camada','flag','titulo','arquivo','enunciado','codigoInicial'])assert.equal(typeof c[key],'string',c.id+': '+key);
  assert(c.id&&c.titulo&&c.enunciado);assert.equal(c.camada,'C');assert.equal(c.modo,'implementar');
  assert(c.estacoes.length&&c.estacoes.every(id=>typeof id==='string'));
  assert(flags.some(flag=>flag.id===c.flag));assert(c.codigoInicial.includes('// TODO'));
  assert(Array.isArray(c.casosFixos)&&c.casosFixos.length);assert.equal(typeof c.gerarCasos,'function');assert.equal(typeof c.referencia,'function');
  assert(c.maxErros===null||Number.isInteger(c.maxErros)&&c.maxErros>0);
  assert.equal(c.dicas.length,3);assert(c.dicas.every(d=>typeof d==='string'&&d.trim()));
  for(const seed of [1,42,2026]){
   const generated=c.gerarCasos(seeded(seed));assert(Array.isArray(generated)&&generated.length);
   assert.deepEqual(generated,c.gerarCasos(seeded(seed)),'gerador deve usar o rng recebido');
   const entradas=[...structuredClone(c.casosFixos),...generated];
   const expected=entradas.map(entrada=>c.referencia(structuredClone(entrada)));
   assert.deepEqual(expected,JSON.parse(JSON.stringify(expected)),'saídas precisam ser JSON');
   const reference=execute('return ('+c.referencia.toString()+')(input);',entradas);
   assert.deepEqual(reference,{saidas:expected},c.id+' referência/Worker');
   const starter=execute(c.codigoInicial,entradas);
   assert(!starter.erro,'código vibecodado deve executar: '+c.id);
   assert.notDeepEqual(starter.saidas,expected,c.id+' código inicial deve falhar');
  }
 }
 console.log('Formato/Worker: todos os desafios carregados, três dicas, flags válidas, TODO, referências e códigos iniciais recusados em três sementes aprovados.');
}
// Fixtures somente no teste: não antecipam os desafios narrativos das próximas tarefas.
const fixture={id:'teste-livre',caso:'teste',camada:'C',flag:'retry-C',estacoes:['computer_dev_left'],requires:'talk:teste',
 titulo:'Teste livre',arquivo:'livre.js',enunciado:'Retorne o dobro.',codigoInicial:'// TODO\nreturn 0;',modo:'implementar',
 casosFixos:[0,1,-1],gerarCasos:rng=>[Math.floor(rng()*100)+2],referencia:input=>input*2,
 dicas:['Direção','Conceito','Passo'],maxErros:null};
function service(){
 let time=0;const api=createChallengeService({catalog:[...challenges,fixture],now:()=>time}),s=fresh(),other=fresh();
 assert(!api.list(s,'computer_dev_left').desafios.some(c=>c.id===fixture.id));
 for(const fn of [()=>api.start(s,fixture.id),()=>api.hint(s,fixture.id),()=>api.submit(s,fixture.id,'x',{})])status(fn,404);
 s.progresso.push('talk:teste');assert.equal(api.list(s,'computer_dev_left').desafios.length,2);
 const publicC=api.list(s,'computer_dev_left').desafios[1];
 for(const key of ['flag','requires','referencia','casosFixos','gerarCasos','dicas','senha','recompensa'])assert(!(key in publicC),key+' vazou');
 assert.deepEqual(api.list(s,'outra').desafios,[]);
 for(let i=0;i<4;i++){const h=api.hint(s,fixture.id);assert.equal(h.nivel,Math.min(i+1,3));assert.equal(h.dica,fixture.dicas[h.nivel-1]);}
 assert.equal(api.list(s,'computer_dev_left').desafios[1].dicasUsadas,3);
 assert.equal(api.list(s,'computer_dev_left').desafios[1].erros,0);
 let e=api.start(s,fixture.id);time+=EXECUTION_TTL;status(()=>api.submit(s,fixture.id,e.execucao,{saidas:[]}),409);
 const old=api.start(s,fixture.id);e=api.start(s,fixture.id);status(()=>api.submit(s,fixture.id,old.execucao,{saidas:[]}),409);
 status(()=>api.submit(s,fixture.id,e.execucao,{saidas:[]}),400);
 other.progresso.push('talk:teste');status(()=>api.submit(other,fixture.id,e.execucao,{saidas:e.entradas.map(fixture.referencia)}),409);
 for(let i=0;i<5;i++){e=api.start(s,fixture.id);const r=api.submit(s,fixture.id,e.execucao,execute(fixture.codigoInicial,e.entradas));assert(!r.ok);assert(!r.gameOver);assert.equal(r.erros,i+1);}
 e=api.start(s,fixture.id);const solved=api.submit(s,fixture.id,e.execucao,{saidas:e.entradas.map(fixture.referencia)});
 assert(solved.ok&&solved.captura.nova);assert.equal(solved.contagem.flags,1);assert(!s.progresso.includes('clue:undefined'));
 status(()=>api.submit(s,fixture.id,e.execucao,{saidas:[]}),409);status(()=>api.hint(s,fixture.id),409);
 assert.equal(api.list(other,'computer_dev_left').desafios[1].dicasUsadas,0);
 createSessions().reset(s);assert.equal(api.list(s,'computer_dev_left').desafios.length,1);
 s.progresso.push('talk:teste');assert.equal(api.list(s,'computer_dev_left').desafios[1].dicasUsadas,0);
 console.log('Motor: múltiplos desafios, requires em todas as rotas, dicas persistentes em ordem, isolamento, reset, execução única/expirada, tentativas ilimitadas e captura aprovados.');
}
async function http(){
 const server=createApp();await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const base='http://127.0.0.1:'+server.address().port;let cookie='';
 async function call(path,body){const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{cookie,'Content-Type':'application/json'},...(body===undefined?{}:{body:JSON.stringify(body)})});
  cookie=res.headers.get('set-cookie')?.split(';')[0]||cookie;return {status:res.status,data:await res.json()};}
 try{
  assert.equal((await call('/api/jogo/desafios?estacao=computer_dev_left')).status,401);
  assert.equal((await call('/api/jogo/desafios/computer_dev_left/dica',{})).status,401);
  await call('/api/jogo/nova-partida',{});
  assert.equal((await call('/api/jogo/desafios')).status,400);
  let listed=await call('/api/jogo/desafios?estacao=computer_dev_left');assert.equal(listed.status,200);assert.equal(listed.data.desafios.length,1);
  assert.equal((await call('/api/jogo/desafios/computer_dev_right/dica',{})).status,403);
  for(let i=1;i<=3;i++){const h=await call('/api/jogo/desafios/computer_dev_left/dica',{});assert.equal(h.status,200);assert.equal(h.data.nivel,i);}
  assert.equal((await call('/api/jogo/desafios/computer_dev_left/dica',{})).data.nivel,3);
  const e=(await call('/api/jogo/desafios/computer_dev_left/execucao',{})).data;
  assert(!('expected' in e));assert(!('codigoInicial' in e));
  // A rota S2 consome a execução iniciada pela rota genérica: um único estado.
  const c=challenges.find(c=>c.id==='computer_dev_left');
  const solved=(await call('/api/jogo/missoes/'+c.id+'/execucao/'+e.execucao,{saidas:e.entradas.map(c.referencia)})).data;
  assert(solved.ok&&solved.captura.nova);assert(solved.senha);
  assert((await call('/api/jogo/desafios?estacao='+c.id)).data.desafios[0].resolvida);
  await call('/api/jogo/nova-partida',{});listed=await call('/api/jogo/desafios?estacao='+c.id);
  assert.equal(listed.data.desafios[0].dicasUsadas,0);assert(!listed.data.desafios[0].resolvida);
  for(const path of ['/server/challenges.cjs',...fs.readdirSync('server/data/challenges').map(name=>'/server/data/challenges/'+name)])assert.equal((await call(path)).status,404);
  console.log('HTTP: sessão obrigatória, consulta por estação, bloqueio S2, três dicas, compatibilidade entre rotas, flags, reset e arquivos privados aprovados.');
 }finally{await new Promise(resolve=>server.close(resolve));}
}
function client(){
 class Case {terminal(){}close(){}}
 const nodes=new Map(),node=selector=>{if(!nodes.has(selector))nodes.set(selector,{value:'',textContent:'',disabled:false});return nodes.get(selector);};
 const element=()=>({children:[],classList:{toggle(){}},setAttribute(key,value){this[key]=value;},append(child){this.children.push(child);},prepend(child){this.children.unshift(child);}});
 const s=fresh();s.progresso.push('talk:teste');const api=createChallengeService({catalog:[...challenges,fixture]});
 const scope=vm.createContext({CaseExperience:Case,CODE_MISSIONS:require('./data/code-missions.js'),document:{createElement:element},
  api:{get:async path=>path.includes('/missoes')?api.legacyList(s):api.list(s,'computer_dev_left'),post:async path=>api.hint(s,path.split('/')[4])},console});
 vm.runInContext(fs.readFileSync('engine/computer.js','utf8')+'\nglobalThis.ZeroComputer=ZeroComputer;',scope);
 const owner={panel:{querySelector:node},solved:new Set(),g:{clues:{addClue(){},getState:()=>({})},hud:{update(){}}}};
 return (async()=>{
  const pc=new scope.ZeroComputer(owner);pc.c={id:'computer_dev_left'};pc.record(pc.c.id);await pc.sync();const body=element();
  pc.renderMission(pc.c,body);assert.equal(body.children[0].children.length,3);
  assert(node('.code-editor').value.includes('// TODO'),'metadados do servidor inicializam rascunho criado pela escolha de SO');
  const original=pc.record(pc.currentId());node('.code-editor').value='// meu rascunho';node('.code-editor').oninput();
  body.children[0].children[2].onclick();assert.equal(pc.currentId(),fixture.id);assert.equal(node('.code-editor').value,fixture.codigoInicial);
  assert.equal(node('.code-attempts').textContent,'Sem limite de tentativas');assert(!node('.code-run').disabled);
  for(let i=1;i<=3;i++){await node('.code-hint').onclick();assert(node('.code-output').textContent.includes('D.A.N.I.E.L. · Dica '+i+'/3'));}
  await pc.sync();pc.renderMission(pc.c,body);assert(node('.code-output').textContent.includes('Passo'));
  body.children[0].children[1].onclick();assert.equal(node('.code-editor').value,'// meu rascunho');assert.equal(original.errors,0);
  pc.selectedId='computer_dev_right';const locked=api.list(s,'computer_dev_right').desafios[0];
  pc.stationChallenges.push({...locked,name:locked.titulo,file:locked.arquivo});pc.record(locked.id).unlocked=false;
  pc.renderMission(pc.c,body);assert(body.innerHTML.includes('Estação protegida'));assert.equal(body.children[0].children.length,4,'lista permanece acessível no arquivo bloqueado');
  body.children[0].children[2].onclick();assert.equal(pc.currentId(),fixture.id);assert(!node('.code-run').disabled);
  console.log('ZeroTrace: lista Arquivos, seleção, rascunhos independentes, tentativas ilimitadas e dicas exibidas/preservadas aprovados.');
 })();
}
(async()=>{format();service();await http();await client();})().catch(error=>{console.error(error);process.exitCode=1;});
