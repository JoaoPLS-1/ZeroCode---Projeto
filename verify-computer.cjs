const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const missions=require('./data/code-missions');
const workerSource=fs.readFileSync('engine/code-worker.js','utf8');
function execute(source,tests){let result;const scope=vm.createContext({self:{postMessage:r=>result=r},structuredClone});vm.runInContext(workerSource,scope);scope.data={source,tests};vm.runInContext('self.onmessage({data})',scope,{timeout:300});return result;}
const solutions=[
 'return input.status === 503 && input.attempt < 3;',
 'const e=input.find(e=>e.type==="deploy"); return e ? e.time : null;',
 'return input.filter(t=>t.status==="SKIP").map(t=>t.name);',
 'return Math.min(8000,1000*2**input);',
 'return {rollback: input.retries>100 && input.externalTraffic==="baseline", isolate:input.retries>100};'
];
missions.forEach((m,i)=>{assert(execute(solutions[i],m.tests).ok,m.id);assert(!execute(m.starter,m.tests).ok,m.id+' broken starter passed');});
assert(!execute('return ; syntax ?',missions[0].tests).ok);
assert.throws(()=>execute('while(true){}',missions[0].tests),/timed out/);
class Case {terminal(){}close(){this.closed=true;}}
const nodes=new Map();const node=s=>{if(!nodes.has(s))nodes.set(s,{value:'return false;',textContent:'',disabled:false,focus(){}});return nodes.get(s);};
class Worker {constructor(){Worker.current=this;}postMessage(data){this.data=data;}terminate(){this.stopped=true;}respond(result){this.onmessage({data:result});}}
const scope=vm.createContext({CaseExperience:Case,CODE_MISSIONS:missions,Worker,setTimeout:()=>1,clearTimeout(){},location:{reload(){}},console});
vm.runInContext(fs.readFileSync('engine/computer.js','utf8')+'\nglobalThis.ZeroComputer=ZeroComputer;',scope);
const found=new Set(),owner=new Case();Object.assign(owner,{panel:{querySelector:node},solved:new Set(),errors:0,g:{state:'case',clues:{addClue:id=>found.add(id),getState:()=>({})},hud:{update(){}}}});
const pc=owner.computer=new scope.ZeroComputer(owner);pc.c={id:missions[0].id,clueRef:'evidence'};
let r=pc.record(pc.c.id);assert.equal(pc.record(missions[1].id).unlocked,false);
for(const mission of missions){const state=pc.record(mission.id);assert.notEqual(state.folder,state.tutorialFolder,'Tutorial must be separate from mission instructions');assert.equal(pc.record(mission.id).tutorialFolder,state.tutorialFolder,'Folder must remain stable during the run');}
pc.run();assert.equal(pc.worker,null,'Must read manual first');r.read=true;
pc.run();assert(pc.worker);pc.stop();assert.equal(r.errors,0,'Cancel is not a code error');
for(let i=1;i<=3;i++){pc.run();Worker.current.respond({ok:false,error:'Wrong return value'});assert.equal(r.errors,i);assert.equal(pc.record(pc.c.id),r,'Reopening must retain errors');}
assert(pc.dead);assert.equal(owner.g.state,'gameover');owner.close();assert(!owner.closed,'Game over cannot be dismissed');
const pc2=new scope.ZeroComputer(owner);owner.computer=pc2;pc2.c={id:missions[0].id,clueRef:'evidence'};r=pc2.record(pc2.c.id);r.read=true;
pc2.run();Worker.current.respond({ok:true});assert(r.solved);assert(found.has('evidence'));assert(owner.solved.has(missions[0].id));
pc2.run();assert.equal(pc2.worker,null,'Solved missions cannot execute again');
console.log('Código: cinco soluções reais, testes negativos, sintaxe, loop infinito, credenciais, tentativas persistentes, recompensa e game over aprovados.');
