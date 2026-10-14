const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const { flags } = require('./server/data/flags.cjs');
const { capturar, listar } = require('./server/flags.cjs');
const progress = require('./server/progress.cjs');
const { createApp } = require('./server/app.cjs');
const { missions } = require('./server/data/missions.cjs');

async function verify() {
  assert.equal(new Set(flags.map(flag => flag.id)).size, 20);
  for (const flag of flags) {
    for (const field of ['id','caso','camada','titulo','conceito','vibecodeErrou','ficha','lembranca'])assert.equal(typeof flag[field], 'string');
    assert(['D','E','C','P'].includes(flag.camada));
  }
  for(const id of ['retry-C','provisoria-2','provisoria-3','provisoria-4','provisoria-5'])assert(flags.find(flag=>flag.id===id).provisoria);
  const session = { progresso:[] };
  assert.deepEqual(listar(session), { flags:[], lembrancas:0, meta:5 });
  assert.throws(()=>capturar(session,'inexistente'),error=>error.status===404);
  assert.deepEqual(session.progresso,[]);
  for (const [i,id] of ['retry-D','pagamento-E','crachas-C','mural-C','upload-D','pipeline'].entries()) {
    const result = capturar(session,id);
    assert(result.nova);assert.equal(result.lembrancas,i+1);assert.equal(result.wiresharkLiberado,i===4);
    assert.equal('senhaLembrada' in result,i===4);
    const before = progress.all(session), duplicate = capturar(session,id);
    assert(!duplicate.nova);assert(!duplicate.wiresharkLiberado);assert.deepEqual(progress.all(session),before);
    assert.equal(progress.has(session,'app:wireshark'),i>=4);
  }
  assert.equal(progress.count(session,'evento:senha-lembrada'),1);
  assert.equal(listar(session).flags.length,6);
  console.log('Flags: catálogo completo, captura idempotente, contagem, 5ª lembrança e desbloqueio único aprovados.');

  const previousDev = process.env.ZC_DEV;
  try {
    for (const dev of [undefined,'0','true','1']) {
      if(dev===undefined)delete process.env.ZC_DEV;else process.env.ZC_DEV=dev;
      const app = createApp();
      // Alterar o ambiente depois não cria/remove a rota de um servidor já iniciado.
      process.env.ZC_DEV=dev==='1'?'0':'1';
      await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));
      let cookie;
      async function call(path,body,status=200,sessionCookie=cookie) {
        const response=await fetch('http://127.0.0.1:'+app.address().port+path,{
          method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(sessionCookie?{Cookie:sessionCookie}:{})},
          ...(body===undefined?{}:{body:JSON.stringify(body)})
        });
        assert.equal(response.status,status,path);assert.equal(response.headers.get('cache-control'),'no-store');
        return { payload:await response.json(), cookie:response.headers.get('set-cookie')?.split(';')[0] };
      }
      try {
        await call('/api/jogo/flags',undefined,401);
        await call('/api/jogo/dev/flag',{id:'retry-C'},dev==='1'?401:404);
        cookie=(await call('/api/jogo/nova-partida',{})).cookie;
        assert.deepEqual((await call('/api/jogo/flags')).payload,{ok:true,flags:[],lembrancas:0,meta:5});
        await call('/server/data/flags.cjs',undefined,404);
        await call('/api/jogo/eventos',{chave:'flag:retry-C'},403);
        if(dev!=='1')await call('/api/jogo/dev/flag',{id:'retry-C'},404);
        else {
          for(const body of [null,{}, {id:2}])await call('/api/jogo/dev/flag',body,400);
          await call('/api/jogo/dev/flag',{id:'inexistente'},404);
          for(const [i,id] of ['retry-C','provisoria-2','provisoria-3','provisoria-4','provisoria-5'].entries()) {
            const result=(await call('/api/jogo/dev/flag',{id})).payload;
            assert(result.captura.nova);assert.equal(result.captura.lembrancas,i+1);
            assert.equal(result.captura.wiresharkLiberado,i===4);
            assert.equal((await call('/api/jogo/dev/flag',{id})).payload.captura.nova,false);
          }
          assert((await call('/api/jogo/estado')).payload.progresso.includes('app:wireshark'));
          const listed=(await call('/api/jogo/flags')).payload;
          assert.equal(listed.flags.length,5);assert.equal(listed.lembrancas,5);
          assert(!JSON.stringify(listed).includes('pagamento'));
          assert(!JSON.stringify(listed).includes('senhaLembrada'));
          const other=(await call('/api/jogo/nova-partida',{},200,'')).cookie;
          assert.equal((await call('/api/jogo/flags',undefined,200,other)).payload.flags.length,0);
          await call('/api/jogo/nova-partida',{});
        }
        for (const [i,mission] of missions.entries()) {
          const execution=(await call('/api/jogo/missoes/'+mission.id+'/execucao',{})).payload;
          const solved=(await call('/api/jogo/missoes/'+mission.id+'/execucao/'+execution.execucao,
            {saidas:execution.entradas.map(mission.reference)})).payload;
          const id=i===0?'retry-C':'provisoria-'+(i+1);
          assert(solved.ok);assert(solved.captura.nova);assert(solved.progresso.includes('flag:'+id));assert(solved.progresso.includes('mem:'+id));
          assert.equal(solved.captura.wiresharkLiberado,i===4);
          const listed=(await call('/api/jogo/flags')).payload;
          assert.equal(listed.flags.length,i+1);assert.equal(listed.lembrancas,i+1);
          assert(!JSON.stringify(listed).includes('vibecodeErrou":null'));
          if(i<4)await call('/api/jogo/missoes/'+missions[i+1].id+'/desbloquear',{senha:solved.senha});
        }
        await call('/api/jogo/nova-partida',{});
        assert.deepEqual((await call('/api/jogo/flags')).payload,{ok:true,flags:[],lembrancas:0,meta:5});
      } finally { await new Promise(resolve=>app.close(resolve)); }
    }
  } finally { if(previousDev===undefined)delete process.env.ZC_DEV;else process.env.ZC_DEV=previousDev; }
  console.log('Flags por HTTP: sessão, ausência de vazamento, isolamento, reset, rota dev somente com ZC_DEV=1 e cinco missões (Dev 1 → retry-C) aprovados.');

  const responseScope=vm.createContext({AbortController,setTimeout,clearTimeout,
    fetch:async()=>({ok:true,json:async()=>({captura:{nova:true}})})});
  vm.runInContext(fs.readFileSync('engine/api.js','utf8')+'\nglobalThis.clientApi=api;',responseScope);
  const responses=[];const unsubscribe=responseScope.clientApi.onResposta((result,path)=>responses.push({result,path}));
  await responseScope.clientApi.post('/api/jogo/dev/flag',{id:'retry-C'});
  assert.equal(responses[0].path,'/api/jogo/dev/flag');assert(responses[0].result.captura.nova);
  unsubscribe();await responseScope.clientApi.get('/api/jogo/flags');assert.equal(responses.length,1);

  // Exercita fila e restauração da estação sem depender de um navegador.
  function element() {
    const children=new Map(),classes=new Set();
    return { isConnected:true,children,append(){},setAttribute(){},focus(){},replaceChildren(){},
      classList:{add:key=>classes.add(key),remove:key=>classes.delete(key),contains:key=>classes.has(key)},
      querySelector(selector){if(!children.has(selector))children.set(selector,element());return children.get(selector);} };
  }
  const panelRoot=element(),dialogueRoot=element(),scope=vm.createContext({module:{exports:{}},
    document:{createElement:element,getElementById:()=>panelRoot,activeElement:element()},
    window:{addEventListener(type,listener){scope.key=listener;}},
    api:{onResposta(listener){scope.receive=listener;},get:async()=>({flags:[]})}
  });
  vm.runInContext(fs.readFileSync('engine/flags-ui.js','utf8'),scope);
  let memoryCount,locks=0;
  const game={state:'case',input:{keys:{},_justPressed:{}},hud:{setLembrancas(count){memoryCount=count;},showPrompt(){}},
    case:{setMenuOpen(){}},mission:{active:false},_lockInteractions(){locks++;},dialogue:{root:dialogueRoot,active:true,
      open(def,complete){this.def=def;this.complete=complete;this.active=true;},
      advance(){this.active=false;this.complete();},close(){this.active=false;}}};
  const ui=new scope.module.exports(game);
  const capture=capturar({progresso:[]},'retry-C');
  scope.receive({captura:capture,contagem:{lembrancas:1}},'/api/jogo/dev/flag');
  assert.equal(memoryCount,1);assert.equal(ui.update(),false,'Interrompeu diálogo em andamento');
  game.dialogue.active=false;assert(ui.update());assert.equal(game.state,'flag');
  assert.equal(ui.panel.querySelector('.flag-sheet').textContent,capture.flag.ficha);
  scope.receive({captura:{...capture,nova:false}},'/api/jogo/dev/flag');assert.equal(ui.queue.length,0);
  ui.remember();assert.equal(game.dialogue.def.lines[0].speaker,'thought');assert(dialogueRoot.classList.contains('flag-memory'));
  game.dialogue.continueEl=element();
  scope.key({code:'Tab',preventDefault(){},stopImmediatePropagation(){}});
  scope.receive({captura:capturar({progresso:[]},'pipeline')},'/api/jogo/dev/flag');
  assert.equal(ui.queue.length,1);assert(ui.update());assert.equal(game.dialogue.def.lines.length,1);
  game.dialogue.advance();assert.equal(game.state,'case');assert.equal(locks,1);
  assert(ui.update());ui.remember();game.dialogue.advance();assert.equal(ui.queue.length,0);
  const fifthSession={progresso:[]};let fifth;
  for(const id of ['retry-C','provisoria-2','provisoria-3','provisoria-4','provisoria-5'])fifth=capturar(fifthSession,id);
  scope.receive({captura:fifth},'/api/jogo/dev/flag');ui.update();ui.remember();
  assert.equal(game.dialogue.def.lines.length,3);assert.equal(game.dialogue.def.npcName,'D.A.N.I.E.L.');
  assert.equal(game.dialogue.def.lines[1].speaker,'thought');
  scope.receive({ok:true},'/api/jogo/nova-partida');assert.equal(memoryCount,0);assert.equal(ui.queue.length,0);assert(!ui.active);
  assert.equal(game.state,'case');assert(!dialogueRoot.classList.contains('flag-memory'));
  console.log('Interface: fila sem interromper diálogo, ficha, pensamento de Kael, fala da 5ª lembrança, duplicatas, restauração da estação e reset aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
