const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const { createRouter } = require('./server/router.cjs');
const { createSessions } = require('./server/sessions.cjs');
const { installSecretDoorRoutes } = require('./server/secret-door.cjs');
const Progress = require('./engine/progress.js');
const content = require('./data/secret-door.js');
const endpoint = '/api/jogo/porta-secreta';
const correct = { ip:'10.19.56.7', porta:2017 }, wrong = { ip:'10.0.0.1', porta:80 };
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
async function post(base, body, cookie){
  const response=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},body:JSON.stringify(body)});
  return {status:response.status,body:await response.json(),retry:response.headers.get('retry-after')};
}
async function verify(){
  const app=createApp(),base=await listen(app);
  try{
    assert.equal((await post(base,correct)).status,401);
    const created=await fetch(base+'/api/jogo/nova-partida',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    const cookie=created.headers.get('set-cookie').split(';')[0];
    for(const body of [null,[],{}, {ip:123,porta:2017},{ip:'999.1.1.1',porta:2017},
      {ip:'1.2.3',porta:2017},{ip:'1.2.3.4',porta:'2017'},{ip:'1.2.3.4',porta:0},
      {ip:'1.2.3.4',porta:65536},{ip:'1.2.3.4',porta:1.5}])assert.equal((await post(base,body,cookie)).status,400);
    for(const body of [wrong,{ip:correct.ip,porta:80},{ip:wrong.ip,porta:correct.porta}])
      assert.deepEqual((await post(base,body,cookie)).body,{ok:false});
    const accepted=await post(base,correct,cookie);assert.equal(accepted.status,200);assert.equal(accepted.body.ok,true);
    assert(accepted.body.progresso.includes('acesso:sala-secreta'));
    const repeat=await post(base,correct,cookie);assert.equal(repeat.body.progresso.filter(k=>k==='acesso:sala-secreta').length,1);
    const blocked=await post(base,correct,cookie);assert.equal(blocked.status,429);assert.equal(blocked.retry,'60');assert(blocked.body.erro.includes('Aguarde'));
    assert(!blocked.body.erro.includes(correct.ip));
    const second=await fetch(base+'/api/jogo/nova-partida',{method:'POST',headers:{'Content-Type':'application/json'},body:'{}'});
    const otherCookie=second.headers.get('set-cookie').split(';')[0];
    const otherState=await (await fetch(base+'/api/jogo/estado',{headers:{Cookie:otherCookie}})).json();
    assert(!otherState.progresso.includes('acesso:sala-secreta'));assert.equal((await post(base,wrong,otherCookie)).status,200);
    const spoof=await fetch(base+'/api/jogo/eventos',{method:'POST',headers:{'Content-Type':'application/json',Cookie:otherCookie},body:JSON.stringify({chave:'acesso:sala-secreta'})});assert.equal(spoof.status,403);
    await fetch(base+'/api/jogo/nova-partida',{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:'{}'});
    const resetState=await (await fetch(base+'/api/jogo/estado',{headers:{Cookie:cookie}})).json();assert(!resetState.progresso.includes('acesso:sala-secreta'));
    assert.equal((await post(base,correct,cookie)).body.ok,true);
    assert.equal((await fetch(base+'/server/secret-door.cjs')).status,404);
    const malformed=await fetch(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie},body:'{'});assert.equal(malformed.status,400);
    console.log('Porta / API: sessão obrigatória, corpos inválidos 400, erros sem indicação do campo, acerto e progresso, duplicatas, 6ª tentativa 429, isolamento, evento forjado 403, reset e constantes privadas aprovados.');
  }finally{await new Promise(resolve=>app.close(resolve));}
  let time=0;
  const router=createRouter(),sessions=createSessions({now:()=>time});
  let sessionCookie;
  sessions.create({setHeader(name,value){sessionCookie=value.split(';')[0];}});
  installSecretDoorRoutes(router,sessions,{now:()=>time});
  const timed=http.createServer((req,res)=>router.handle(req,res,endpoint)),timedBase=await listen(timed);
  try{
    for(let i=0;i<5;i++)assert.equal((await post(timedBase,wrong,sessionCookie)).status,200);
    time=59999;assert.equal((await post(timedBase,correct,sessionCookie)).status,429);
    time=60000;assert.equal((await post(timedBase,correct,sessionCookie)).body.ok,true);
    console.log('Porta / limite: janela de 60 segundos expira exatamente no limite, sem espera real.');
  }finally{await new Promise(resolve=>timed.close(resolve));}

  // DOM mínimo para verificar decisões de fluxo e respostas pendentes.
  class Element{
    constructor(){this.value='';this.disabled=false;this.attrs={};}
    setAttribute(name,value){this.attrs[name]=value;}focus(){document.activeElement=this;}remove(){this.removed=true;}
    querySelector(selector){return this.elements[selector];}
    querySelectorAll(){return [this.elements['#secret-door-ip'],this.elements['#secret-door-port'],this.elements['[type="button"]'],this.elements['[type="submit"]']];}
    set innerHTML(value){this.elements=Object.fromEntries(['h2','form','.secret-door-instruction','#secret-door-ip','#secret-door-port','.secret-door-status','[type="button"]','[type="submit"]'].map(s=>[s,new Element()]));}
  }
  const document={createElement:()=>new Element(),activeElement:new Element()},listeners=new Set();
  const window={addEventListener(type,handler,capture){assert.equal(capture,true);listeners.add(handler);},removeEventListener(type,handler){listeners.delete(handler);}};
  let response={ok:false},calls=0;
  const scope=vm.createContext({module:{exports:{}},document,window,SECRET_DOOR:content,api:{post:async(path,body)=>{calls++;assert.equal(path,endpoint);assert.equal(body.porta,80);return response;}}});
  vm.runInContext(fs.readFileSync('engine/secret-door.js','utf8'),scope);
  const game={state:'playing',progress:new Progress(),input:{keys:{},_justPressed:{}},hud:{showPrompt(){}},canvas:{parentElement:{append(){}}},_lockInteractions(){},dialogue:{open(def,callback){this.def=def;this.callback=callback;}},_changeRoom(id,spawn){this.destination=[id,spawn];}};
  const door=new scope.module.exports(game),submit=()=>door.root.querySelector('form').onsubmit({preventDefault(){}});
  const open=()=>{door.open('entryMain');door.root.querySelector('#secret-door-ip').value=wrong.ip;door.root.querySelector('#secret-door-port').value='80';};
  open();assert.equal(game.state,'secret-door');assert.equal(listeners.size,1);
  await submit();assert.equal(door.root.querySelector('.secret-door-status').textContent,content.refused);assert(!game.destination);
  response=Promise.reject(new Error('Sem conexão'));await submit();assert.equal(door.root.querySelector('.secret-door-status').textContent,'Sem conexão');
  let release;response=new Promise(resolve=>{release=resolve;});const pending=submit(),before=calls;await submit();assert.equal(calls,before);
  const root=door.root;door.keyHandler({code:'Escape',preventDefault(){},stopImmediatePropagation(){}});assert.equal(door.root,null);assert(root.removed);assert.equal(game.state,'playing');assert.equal(listeners.size,0);
  release({ok:true,progresso:['acesso:sala-secreta']});await pending;assert(!game.destination);assert(!game.dialogue.def);
  open();response={ok:true,progresso:['acesso:sala-secreta']};await submit();assert.equal(door.root,null);assert.equal(listeners.size,0);assert.equal(game.dialogue.def,content.accepted);
  game.dialogue.callback();assert.deepEqual(game.destination,['room_secret','entryMain']);
  const gameScope=vm.createContext({module:{exports:{}},SecretDoor:class{open(){this.opened=true;}}});
  vm.runInContext(fs.readFileSync('engine/game.js','utf8'),gameScope);
  const guarded=Object.create(gameScope.module.exports.prototype);guarded.state='playing';guarded.progress=new Progress();guarded.inventory={has:()=>true};
  guarded._changeRoom('room_secret','entryMain');assert(guarded.secretDoor.opened,'Passe não deve liberar a porta');
  guarded.secretDoor.opened=false;guarded.progress.sincronizar({progresso:['acesso:sala-secreta']});guarded.roomManager={getRoom:()=>null};
  guarded._changeRoom('room_secret','entryMain');assert.equal(guarded.secretDoor.opened,false,'Acesso concedido não deve pedir painel novamente');
  console.log('Porta / cliente: pausa, recusa, falha de rede, envio duplicado, Esc, limpeza, resposta tardia, mensagem e pensamento, transição e retorno sem painel aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
