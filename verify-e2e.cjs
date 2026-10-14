const assert = require('node:assert/strict');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');

// Mesmos corpos de referência de verify-computer.cjs, sem carregar seus serviços privados.
const solutions = [
  'return input.status === 503 && input.attempt < 3;',
  'const e=input.find(e=>e.type==="deploy"); return e ? e.time : null;',
  'return input.filter(t=>t.status==="SKIP").map(t=>t.name);',
  'return Math.min(8000,1000*2**input);',
  'return {rollback: input.retries>100 && input.externalTraffic==="baseline", isolate:input.retries>100};'
];
const paymentSolutions = {
  'pagamento-validar': `const {pedido,catalogo}=input;
    if (!Object.hasOwn(catalogo,pedido.produto) || !Number.isInteger(pedido.quantidade) ||
        pedido.quantidade<1 || pedido.quantidade>10) return {ok:false,erro:'Pedido inválido.'};
    return {ok:true,total:Number((pedido.quantidade*catalogo[pedido.produto]).toFixed(2))};`,
  'pagamento-idempotencia': 'return input.jaProcessados.includes(input.requestId) ? "duplicado" : "processado";'
};
const choices = {omega:'isolar',deploy:'rollback',processo:'revisao'};
const encounter = {chave:'evento:omega-encontrada',sala:'room_secret'};
const capturePath = 'captura?estacao=computer_infra_upper';

function execute(workerSource, source, entradas) {
  let result;
  const scope = vm.createContext({self:{postMessage:value=>{result=value;}},structuredClone});
  vm.runInContext(workerSource,scope,{timeout:1000});
  scope.data = {source,entradas};
  vm.runInContext('self.onmessage({data})',scope,{timeout:1000});
  assert(result && !result.erro,'O Worker deve executar a solução: '+result?.erro);
  return JSON.parse(JSON.stringify(result));
}

async function verify() {
  // O ambiente externo também não pode habilitar concessões de desenvolvimento neste teste.
  const dev = process.env.ZC_DEV;
  let server;
  try { delete process.env.ZC_DEV; server = createApp(); }
  finally { if (dev === undefined) delete process.env.ZC_DEV; else process.env.ZC_DEV = dev; }
  let cookie;
  try {
    await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(0,'127.0.0.1',resolve);});
    const base = 'http://127.0.0.1:'+server.address().port;
    async function call(path, body, status=200) {
      const response = await fetch(base+'/api/jogo/'+path,{
        method:body===undefined?'GET':'POST',
        headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},
        ...(body===undefined?{}:{body:JSON.stringify(body)}),
        signal:AbortSignal.timeout(10000)
      });
      const result = await response.json();
      assert.equal(response.status,status,path+': '+JSON.stringify(result));
      if (response.headers.has('set-cookie')) cookie=response.headers.get('set-cookie').split(';')[0];
      return result;
    }
    async function locked(memories) {
      const state = await call('estado');
      assert.equal(state.contagem.lembrancas,memories);
      assert.equal(state.contagem.flags,memories);
      assert.equal(state.progresso.includes('app:wireshark'),memories>=5);
      await call(capturePath,undefined,memories>=5?200:403);
      await call('eventos',encounter,403);
      await call('omega',undefined,403);
      await call('decisao',{escolhas:choices},403);
      assert.equal((await call('decisao/acesso')).liberada,false);
    }
    async function solve(kind,id,source) {
      const path=kind+'/'+encodeURIComponent(id)+'/execucao';
      const execution=await call(path,{});
      assert(execution.execucao && execution.entradas.length);
      const result=await call(path+'/'+execution.execucao,execute(workerSource,source,execution.entradas));
      assert(result.ok,id+': '+JSON.stringify(result));
      assert.equal(result.gameOver,false);
      assert(result.resultados.every(test=>test.passou && !('esperado' in test)),id);
      await call(path+'/'+execution.execucao,execute(workerSource,source,execution.entradas),409);
      return result;
    }

    await call('estado',undefined,401);
    await call('nova-partida',{});
    assert(cookie,'Nova partida deve criar uma sessão HTTP.');
    await locked(0);
    const workerResponse=await fetch(base+'/engine/code-worker.js',{signal:AbortSignal.timeout(10000)});
    assert.equal(workerResponse.status,200);
    const workerSource=await workerResponse.text();
    const missions=(await call('missoes')).missoes;
    assert.equal(missions.length,solutions.length);
    assert.equal(missions[0].bloqueada,false);
    for (const mission of missions.slice(1)) {
      assert(mission.bloqueada && !mission.senha);
      await call('missoes/'+mission.id+'/execucao',{},403);
    }
    for (const id of Object.keys(paymentSolutions)) await call('desafios/'+id+'/execucao',{},404);
    const hidden=(await call('desafios?estacao=computer_dev_left')).desafios;
    assert(hidden.every(challenge=>!Object.hasOwn(paymentSolutions,challenge.id)));
    for (const [index,mission] of missions.entries()) {
      const next=missions[index+1];
      if (next) await call('missoes/'+next.id+'/execucao',{},403);
      const result=await solve('missoes',mission.id,solutions[index]);
      assert.equal(result.contagem.lembrancas,index+1);
      assert(result.captura.nova);
      assert.equal(result.captura.wiresharkLiberado,index===4,'Somente a quinta lembrança libera a captura.');
      if (index===4) {
        assert(result.captura.senhaLembrada);
        assert(result.progresso.includes('app:wireshark'));
      } else assert(!result.captura.senhaLembrada);
      if (next) {
        assert.equal(typeof result.senha,'string');
        // Resolver a anterior ainda exige informar a senha recebida.
        await call('missoes/'+next.id+'/execucao',{},403);
        assert.equal((await call('missoes/'+next.id+'/desbloquear',{senha:'ERRADA'})).ok,false);
        await call('missoes/'+next.id+'/execucao',{},403);
        assert((await call('missoes/'+next.id+'/desbloquear',{senha:result.senha})).ok);
      }
      await locked(index+1);
    }
    assert((await call('missoes')).missoes.every(mission=>mission.resolvida));
    console.log('E2E / código: nova partida, cinco soluções no Worker, ordem, senhas recebidas, execução única; captura 403 até quatro lembranças e liberada na quinta.');

    // Perguntas, review e pipeline são rotas abertas: respostas incorretas são recusadas,
    // sem inventar dependências lineares que o CTF não possui.
    assert.equal((await call('perguntas/pagamento',{resposta:'desconhecido'})).ok,false);
    const log=await call('fs/arquivo?'+new URLSearchParams({estacao:'computer_dev_right',caminho:'/var/log/cobrancas.log'}));
    const counts=new Map();
    for (const line of log.content.split('\n')) {
      const id=/\brequest_id=(\S+)/.exec(line)?.[1];
      assert(id,'Cobrança sem request_id: '+line);
      counts.set(id,(counts.get(id)||0)+1);
    }
    const repeated=[...counts].filter(([,count])=>count>1);
    assert.equal(repeated.length,1,'O log deve apontar um único pedido repetido.');
    assert.equal(repeated[0][1],3);
    const answer=await call('perguntas/pagamento',{resposta:repeated[0][0]});
    assert(answer.ok && answer.captura.nova);
    await locked(6);

    const repoQuery='?estacao=computer_dev_left';
    const reviewPath='repo/prs/214/review'+repoQuery;
    assert.equal((await call(reviewPath,{linhas:[]})).ok,false);
    const {pr}=await call('repo/prs/214'+repoQuery);
    assert.equal(pr.numero,214);
    const problematic=pr.diff.flatMap(file=>file.linhas).filter(line=>
      (line.tipo==='removida' && (/\bif\s*\(attempt\s*>=/.test(line.texto) || /\bschedule\(/.test(line.texto))) ||
      (line.tipo==='adicionada' && /^\s*return retry\(attempt\s*\+\s*1\);/.test(line.texto))
    ).map(line=>line.id);
    assert.equal(problematic.length,3,'Identificar remoção do teto, da espera e recursão imediata pelo diff.');
    const review=await call(reviewPath,{linhas:problematic});
    assert(review.ok && review.revisado && review.captura.nova);
    await locked(7);

    const pipeline=await call('pipeline?estacao=computer_qa_upper');
    assert.equal((await call('pipeline',{yaml:pipeline.yaml})).ok,false);
    const yaml=pipeline.yaml.replace(/allow_failure: true/g,'allow_failure: false');
    assert.notEqual(yaml,pipeline.yaml);
    const fixed=await call('pipeline',{yaml});
    assert(fixed.ok && fixed.captura.nova);
    assert.equal((await call('pipeline?estacao=computer_qa_upper')).yaml,yaml);
    await locked(8);
    console.log('E2E / investigação: request_id deduzido do VFS, PR 214 revisado pelo diff e pipeline corrigida; respostas incorretas recusadas.');

    const payment=(await call('desafios?estacao=computer_dev_left')).desafios;
    for (const [index,id] of Object.keys(paymentSolutions).entries()) {
      assert(payment.some(challenge=>challenge.id===id && !challenge.bloqueada));
      await locked(8);
      const result=await solve('desafios',id,paymentSolutions[id]);
      if (index===0) {
        assert.equal(result.contagem.lembrancas,8);
        assert(!result.captura);
        assert(result.recompensa.includes('1 de 2'));
        await locked(8);
      } else {
        assert.equal(result.contagem.lembrancas,9);
        assert(result.captura.nova && !result.captura.wiresharkLiberado);
        assert(!result.captura.senhaLembrada,'A lembrança da senha não deve se repetir.');
        assert(result.progresso.includes('app:wireshark'));
      }
    }
    const flags=await call('flags');
    assert.equal(flags.lembrancas,9); assert.equal(flags.flags.length,9);
    await call('captura?estacao=computer_dev_left',undefined,403);
    const {pacotes}=await call(capturePath);
    assert.equal(pacotes.length,50);
    // Encontrar o batimento pelo protocolo, payload e periodicidade; nenhum IP/porta/índice decorado.
    const groups=new Map();
    for (const packet of pacotes.filter(packet=>packet.protocolo==='TCP' && /^[A-Z]+:[A-Z]+$/.test(packet.payload))) {
      const key=JSON.stringify([packet.origem,packet.destino,packet.portaDestino,packet.payload]);
      if (!groups.has(key)) groups.set(key,[]);
      groups.get(key).push(packet);
    }
    const seconds=packet=>packet.tempo.split(':').reduce((total,part)=>total*60+Number(part),0);
    const heartbeat=[...groups.values()].filter(group=>group.length>=3 &&
      group.slice(1).every((packet,index)=>seconds(packet)-seconds(group[index])===60));
    assert.equal(heartbeat.length,1,'Deve haver um único fluxo TCP periódico com payload cifrado.');
    const suspect=heartbeat[0][0];
    const observed=await call('eventos',{chave:'evento:batimento-visto',estacao:'computer_infra_upper',pacote:suspect.n});
    assert(observed.nova && observed.pensamento);
    await call('eventos',encounter,403);
    await call('decisao',{escolhas:choices},403);
    assert.equal((await call('porta-secreta',{ip:'0.0.0.0',porta:1})).ok,false);
    await call('eventos',encounter,403);
    const door=await call('porta-secreta',{ip:suspect.origem,porta:suspect.portaDestino});
    assert(door.ok && door.progresso.includes('acesso:sala-secreta'));
    // Abrir a porta ainda não é encontrar ÔMEGA.
    await call('omega',undefined,403);
    await call('decisao',{escolhas:choices},403);
    assert.equal((await call('decisao/acesso')).liberada,false);
    await call('eventos',{...encounter,sala:'room_meeting'},403);
    const found=await call('eventos',encounter);
    assert(found.nova && found.cena && found.progresso.includes(encounter.chave));
    assert.equal((await call('eventos',encounter)).nova,false);
    assert((await call('omega')).dialogo);
    assert.equal((await call('decisao/acesso')).liberada,true);
    const decision=await call('decisao',{escolhas:choices});
    assert(decision.ok);
    assert(['S','A'].includes(decision.resultado.rank));
    assert.equal(decision.resultado.flags,9);
    assert.deepEqual((await call('decisao/acesso')).resultado,decision.resultado);
    await call('decisao',{escolhas:choices},409);
    console.log('E2E / final: duas correções do Pagamento, quinta lembrança libera captura, batimento deduzido dos pacotes, porta, encontro obrigatório e decisão única; classificação '+decision.resultado.rank+'.');
  } finally {
    await new Promise((resolve,reject)=>server.close(error=>error?reject(error):resolve()));
  }
}

verify().catch(error=>{console.error(error);process.exitCode=1;});
