const assert=require('node:assert/strict');
const {ROOMS}=require('./data/maps.js');
const objects=require('./data/objects.js'),npcs=require('./data/npcs.js');
const Collision=require('./engine/collision.js'),Interaction=require('./engine/interaction.js');
assert.equal(new Set(npcs.map(n=>n.sprite)).size,npcs.length,'Skins duplicadas');
for(const npc of npcs){
 assert(require('node:fs').existsSync(require('node:path').join(__dirname,npc.sprite)),`Skin ausente: ${npc.id}`);
 assert(new Collision(ROOMS[npc.roomId]).isValidPosition({x:npc.feetX-14,y:npc.feetY-9,width:28,height:18}),`NPC sobre móvel: ${npc.id}`);
}
global.Image=class {};
const Player=require('./engine/player.js');
const freeMovement={resolveMove:(rect,dx,dy)=>({x:rect.x+dx,y:rect.y+dy})};
for(const [x,y,direction] of [[1,1,'down-right'],[-1,1,'down-left'],[1,-1,'up-right'],[-1,-1,'up-left']]){
 const player=new Player(0,0);
 player.update(0.1,{x,y},freeMovement);
 assert.equal(player.facing,direction);
 assert(Math.abs(Math.hypot(player.centerX,player.centerY)-22)<0.001,'Diagonal mais rápida');
 assert(Math.abs(player.walkDistance-22)<0.001,'Cadência inconsistente');
 player.update(0.1,{x:0,y:0},freeMovement);
 assert.equal(player.moving,false);
 assert.equal(player.walkDistance,0);
}
delete global.Image;
console.log('Personagens: skins únicas, posições no chão e quatro diagonais aprovadas.');
const Clues=require('./engine/clues.js'),defs=require('./data/clues.js');
const clues=new Clues(defs);Object.keys(defs).forEach(id=>{assert(clues.addClue(id));assert(!clues.addClue(id));});assert.equal(clues.getRelevantCount(),5);assert.equal(clues.getFoundCount(),11);
for(const room of Object.values(ROOMS)){
 for(const obstacle of room.obstacles){
  if(!obstacle.points)continue;
  const p=obstacle.points,signs=p.map((a,i)=>{
   const b=p[(i+1)%p.length],c=p[(i+2)%p.length];
   return Math.sign((b[0]-a[0])*(c[1]-b[1])-(b[1]-a[1])*(c[0]-b[0]));
  }).filter(Boolean);
  assert(signs.every(sign=>sign===signs[0]),`Polígono não convexo em ${room.id}: ${JSON.stringify(p)}`);
 }
 const collision=new Collision(room),spawn=Object.values(room.spawns)[0],step=8;
 for(const s of Object.values(room.spawns))assert(collision.isValidPosition({x:s.x-14,y:s.y-9,width:28,height:18}),`Spawn inválido ${room.id}`);
 const queue=[[spawn.x,spawn.y]],seen=new Set([spawn.x+','+spawn.y]);
 for(let i=0;i<queue.length;i++){const [x,y]=queue[i];for(const [dx,dy]of [[step,0],[-step,0],[0,step],[0,-step]]){const nx=x+dx,ny=y+dy,key=nx+','+ny;if(!seen.has(key)&&collision.isValidPosition({x:nx-14,y:ny-9,width:28,height:18})){seen.add(key);queue.push([nx,ny]);}}}
 const containers=[...objects,...npcs,...room.doors].filter(c=>c.roomId===room.id),system=new Interaction(containers);
 for(const c of containers){const reachable=queue.some(([x,y])=>system.getNearestInRange(x,y)?.id===c.id);assert(reachable,`Interação inacessível: ${c.id}`);}
 console.log(`${room.name}: ${containers.length} interações alcançáveis, spawns válidos.`);
}
console.log('Evidências: deduplicação e contagem aprovadas.');
// Regressões dos bloqueios invisíveis: chão livre e superfície dos móveis.
const feet=(x,y)=>({x:x-14,y:y-9,width:28,height:18});
for(const [roomId,free,solid] of [
 ['room_meeting',[[600,530],[1070,530],[700,650]],[[405,550],[1250,540],[835,440]]],
 ['room_dev',[[555,600],[845,540],[1160,570]],[[840,460],[865,630]]],
 ['room_cafe',[[1190,605],[1230,705],[285,535]],[[1300,610],[1455,600]]],
 ['room_qa_infra',[[800,840],[625,430],[1290,360]],[[1050,380],[1300,450]]],
]){
 const collision=new Collision(ROOMS[roomId]);
 for(const [x,y]of free)assert(collision.isValidPosition(feet(x,y)),`Chão livre bloqueado: ${roomId} ${x},${y}`);
 for(const [x,y]of solid)assert(!collision.isValidPosition(feet(x,y)),`Móvel atravessável: ${roomId} ${x},${y}`);
}
const wall=new Collision({bounds:{x:0,y:0,width:500,height:500},obstacles:[{x:100,y:0,width:2,height:400}]});
const contact=wall.resolveMove({x:60,y:50,width:28,height:18},30,20);
assert(Math.abs(contact.x-72)<0.01,'Parada antes da borda');assert(Math.abs(contact.y-70)<0.01,'Deslizamento na parede');
const sprint=wall.resolveMove({x:10,y:50,width:28,height:18},350,0);
assert(Math.abs(sprint.x-72)<0.01,'Atravessou obstáculo fino em corrida');
const bounded=wall.resolveMove({x:20,y:420,width:28,height:18},-100,0);
assert(Math.abs(bounded.x)<0.01,'Não encostou no limite da sala');
console.log('Colisões: vãos de mesas, móveis sólidos, contato, deslizamento e corrida aprovados.');
// Exercita a progressão sem depender do canvas ou de um navegador externo.
const vm=require('node:vm'),fs=require('node:fs');
class Element {
 constructor(){this.children=[];this.nodes={};this.classList={add(){},remove(){},toggle(){}};}
 set innerHTML(v){this.children=[];this.nodes={};}
 setAttribute(){} focus(){} append(...nodes){this.children.push(...nodes);}
 addEventListener(name,callback){this[name]=callback;}
 appendChild(node){this.children.push(node);}
 querySelector(s){return this.nodes[s]??=new Element();}
 querySelectorAll(){return [new Element(),new Element()];}
}
class FakeGame {
 start(){} _update(){} _interactWith(c){this.lastInteraction=c;}
 _showResult(correct,def){this.result={correct,def};}
}
const sandbox={Game:FakeGame,document:{createElement:()=>new Element(),getElementById:()=>new Element(),activeElement:new Element()}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync('engine/case.js','utf8'),sandbox);
const game=new FakeGame();game.clues=new Clues(defs);game.state='playing';game.hud={showPrompt(){}};game._lockInteractions=()=>{};
game.dialogue={active:false,open(def,cb){this.def=def;this.cb=cb;}};game.mission={active:false};
game._openContainerContent=c=>game.clues.addClue(c.clueRef);game.start();
const final=objects.find(c=>c.type==='computer_final');game._interactWith(final);assert(!game.lastInteraction);assert(game.dialogue.def.lines[0].text.includes('0/5'));
const answers=[1,0,2,1,0];let i=0;
for(const c of objects.filter(c=>c.type==='computer')){
 game._interactWith(c);assert.equal(game.state,'case');assert(!game.clues.hasClue(c.clueRef));
 const body=game.case.panel.querySelector('.case-content'),buttons=body.children.filter(n=>n.className==='decision-option');
 buttons[(answers[i]+1)%3].onclick();assert(!game.clues.hasClue(c.clueRef));
 buttons[answers[i++]].onclick();assert(game.clues.hasClue(c.clueRef));assert.equal(game.state,'playing');
}
assert.equal(game.case.errors,5);game._interactWith(final);assert.equal(game.lastInteraction,final);
game._showResult(false,{body:['Revisar']});assert.equal(game.result.correct,false);
game._showResult(true,{body:['Resolvido']});assert(game.result.def.body.some(s=>s.includes('CLASSIFICAÇÃO')));
console.log('Progressão: 5 desafios, erro sem pista, acerto com pista, bloqueio inicial e relatório final aprovados.');

// A sala só muda sob cobertura opaca, depois do carregamento do cenário.
const transitionContext={module:{exports:{}},window:{matchMedia:()=>({matches:false})}};
vm.createContext(transitionContext);
vm.runInContext(fs.readFileSync('engine/game.js','utf8'),transitionContext);
const TransitionGame=transitionContext.module.exports;
function transitionFixture(){
 const g=Object.create(TransitionGame.prototype),nodes={span:{},h2:{}};
 g.state='playing';g.roomManager={getRoom:id=>ROOMS[id]};
 g._transitionEl={style:{},classList:{add(){},remove(){}},querySelector:s=>nodes[s]};
 g.asset={loaded:false,failed:false};g.renderer={preloadMap:()=>g.asset};
 g.hud={showPrompt(){}};g._lockInteractions=()=>{g.locked=true;};g.commits=0;
 g._commitRoomChange=(room,spawn)=>{assert.equal(Number(g._transitionEl.style.opacity),1);g.commits++;g.destination=[room,spawn];};
 return g;
}
const travel=transitionFixture();
travel._changeRoom('missing','entryMain');assert.equal(travel.state,'playing');
travel._changeRoom('room_qa_infra','entryMain');assert.equal(travel.state,'transition');
const pending=travel._roomTransition;
travel._changeRoom('room_cafe','entryLeft');assert.equal(travel._roomTransition,pending);
travel._update(0.12);assert.equal(travel.commits,0);assert(Number(travel._transitionEl.style.opacity)>0);
travel._update(0.12);assert.equal(travel.commits,0);
travel._update(0.3);assert.equal(travel.commits,0,'Revelou antes do carregamento');
travel.asset.loaded=true;travel._update(0.01);assert.equal(travel.commits,1);
assert.equal(travel.destination[0],'room_qa_infra');assert.equal(travel.state,'transition');
travel._update(0.19);assert.equal(travel.state,'transition');
travel._update(0.2);assert.equal(travel.state,'playing');assert.equal(travel._roomTransition,null);assert(travel.locked);
for(const failed of [true,false]){
 const g=transitionFixture();g.asset.failed=failed;g._changeRoom('room_cafe','entryLeft');
 g._update(0.24);g._update(failed?0.2:4.1);assert.equal(g.commits,1,'Transição presa por asset indisponível');
 g._update(0.4);assert.equal(g.state,'playing');
}
transitionContext.window.matchMedia=()=>({matches:true});
const reduced=transitionFixture();reduced.asset.loaded=true;reduced._changeRoom('room_cafe','entryLeft');
reduced._update(0.08);reduced._update(0.04);reduced._update(0.12);assert.equal(reduced.state,'playing');
console.log('Transições: cobertura opaca, espera de imagem, bloqueio de repetição, recuperação de falha e movimento reduzido aprovados.');

const dialogueContext={module:{exports:{}},document:{activeElement:new Element()}};
vm.createContext(dialogueContext);
vm.runInContext(fs.readFileSync('engine/dialogue.js','utf8'),dialogueContext);
const dialog=new dialogueContext.module.exports(new Element());let collected=0;
const conversation={lines:[{speaker:'npc',text:'Primeiro trecho'},{speaker:'npc',text:'Segundo trecho'}]};
dialog.open(conversation,()=>collected++);dialog.advance();dialog.close(false);
assert.equal(collected,0,'Cancelar concedeu pista');assert(!dialog.isActive());
dialog.open(conversation,()=>collected++);dialog.advance();dialog.advance();dialog.close();
assert.equal(collected,1,'Pista concedida mais de uma vez');
const missionContext={module:{exports:{}},document:{activeElement:new Element(),createElement:()=>new Element()}};
vm.createContext(missionContext);
vm.runInContext(fs.readFileSync('engine/mission.js','utf8'),missionContext);
const mission=new missionContext.module.exports(new Element(),require('./data/missions.js'));let decisions=0;
mission.open(()=>decisions++);mission._choose('invalid');assert.equal(decisions,0);assert(mission.active);
mission._choose('C');mission._choose('C');assert.equal(decisions,1,'Resultado duplicado');
mission.open(()=>decisions++);mission.close();mission._choose('A');assert.equal(decisions,1,'Painel fechado aceitou decisão');
game.case.errors=0;game.case.hypothesisErrors=0;Object.keys(defs).forEach(id=>game.clues.addClue(id));
game._showResult(false,{body:[]});game._showResult(true,{body:[]});
assert(game.result.def.body[0].includes('CLASSIFICAÇÃO A'),'Hipótese incorreta manteve nota S');
assert(game.result.def.body[0].includes('1 hipóteses incorretas'));
console.log('Revisão: cancelar diálogo sem pista, decisão única e penalidade de hipóteses aprovados.');
let timerId=0;const timers=new Map();
transitionContext.setTimeout=callback=>{timers.set(++timerId,callback);return timerId;};
transitionContext.clearTimeout=id=>timers.delete(id);
transitionContext.document={createElement:()=>new Element()};
const toastGame=Object.create(TransitionGame.prototype);toastGame.dom={clueAlert:new Element()};
toastGame._showClueAlert({title:'Primeira',body:['Pista 1']});
const first=toastGame._clueAlertTimeout,fade=timers.get(first);timers.delete(first);fade();
const staleHide=toastGame._clueAlertHideTimeout;assert(timers.has(staleHide));
toastGame._showClueAlert({title:'Segunda',body:['Pista 2']});
assert(!timers.has(staleHide),'Aviso antigo ainda pode esconder a nova pista');assert.equal(timers.size,1);
console.log('Avisos: coleta durante o desaparecimento da pista anterior aprovada.');
