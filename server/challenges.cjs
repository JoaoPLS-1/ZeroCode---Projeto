const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomInt } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const progress = require('./progress.cjs');
const { capturar } = require('./flags.cjs');
const { readJson, json } = require('./router.cjs');
const EXECUTION_TTL = 60000;
const TEST_CASES_LIMIT = 8 * 1024;
const fail = (status, message) => { throw Object.assign(new Error(message), { status }); };
const challenges = fs.readdirSync(path.join(__dirname,'data/challenges')).filter(name=>name.endsWith('.cjs')).sort()
  .map(name=>require('./data/challenges/'+name));
if(new Set(challenges.map(c=>c.id)).size!==challenges.length)throw new Error('IDs de desafios duplicados.');
const rng = () => randomInt(0x100000000)/0x100000000;
function inputs(c) {
  const result=[...structuredClone(c.casosFixos),...c.gerarCasos(rng)];
  for(let i=result.length-1;i>0;i--){const j=randomInt(i+1);[result[i],result[j]]=[result[j],result[i]];}
  return result;
}
function createChallengeService({now=Date.now,catalog=challenges}={}) {
  const legacy=catalog.filter(c=>Number.isInteger(c.ordemS2)).sort((a,b)=>a.ordemS2-b.ordemS2);
  function stateFor(session,c) {
    session.desafios ??= Object.create(null);
    return session.desafios[c.id] ??= {errors:0,solved:false,unlocked:!Number.isInteger(c.ordemS2)||c.ordemS2===0,
      password:Number.isInteger(c.ordemS2)&&c.ordemS2<legacy.length-1?'ZERO-'+randomBytes(8).toString('hex').toUpperCase():null,
      execution:null,hints:0};
  }
  function station(session,id) {
    const c=catalog.find(c=>c.id===id);
    // Ocultos e inexistentes têm a mesma resposta, inclusive nos POSTs.
    if(session.modo==='rapido'||!c||!progress.requires(session,c.requires))fail(404,'Desafio não encontrado.');
    return {c,state:stateFor(session,c)};
  }
  function active(session,state) {
    if(session.gameOver)fail(409,'A partida terminou. Inicie uma nova investigação.');
    if(!state.unlocked)fail(403,'Estação protegida.');
    if(state.solved)fail(409,'Missão já resolvida.');
  }
  function correctionReward(session,c) {
    if(!c.flagComposta)return c.recompensa;
    const parts=catalog.filter(part=>part.flagComposta&&part.flag===c.flag);
    const solved=parts.filter(part=>stateFor(session,part).solved).length;
    return solved+' de '+parts.length+' correções aplicadas'+(solved===parts.length?'. Validação e idempotência restauradas.':'. Conclua a outra correção para recuperar a evidência do caso Pagamento.');
  }
  function publicData(session,c) {
    const state=stateFor(session,c);
    // Lista explícita: nunca serializar referências, testes privados, flags ou dicas futuras.
    return {id:c.id,titulo:c.titulo,arquivo:c.arquivo,enunciado:c.enunciado,codigoInicial:c.codigoInicial,modo:c.modo,
      ...(c.modo==='testes'?{assinatura:c.assinatura,codigoVibecodado:c.implementacaoVibecodada.toString(),minimoCasos:c.minimoCasos,maximoCasos:c.maximoCasos}:{}),
      maxErros:c.maxErros,bloqueada:!state.unlocked,resolvida:state.solved,erros:state.errors,dicasUsadas:state.hints,
      ...(state.hints?{dica:c.dicas[state.hints-1]}:{}),...(Number.isInteger(c.ordemS2)?{ordemS2:c.ordemS2}:{}),
      ...(state.solved?{recompensa:correctionReward(session,c),clueRef:c.clueRef,...(state.password?{senha:state.password}:{})}:{})};
  }
  return {
    list(session,estacao) {
      if(typeof estacao!=='string'||!estacao)fail(400,'Informe a estação.');
      return {ok:true,...progress.state(session),gameOver:session.gameOver,
        desafios:catalog.filter(c=>session.modo!=='rapido'&&c.estacoes.includes(estacao)&&progress.requires(session,c.requires)).map(c=>publicData(session,c))};
    },
    legacyList(session) {
      return {ok:true,...progress.state(session),gameOver:session.gameOver,missoes:legacy.filter(()=>session.modo!=='rapido').map(c=>{
        const m=publicData(session,c);
        return {...m,name:m.titulo,file:m.arquivo,starter:m.codigoInicial,manual:m.enunciado};
      })};
    },
    start(session,id) {
      const {c,state}=station(session,id);active(session,state);
      const entradas=c.modo==='testes'?[]:inputs(c),expected=entradas.map(entrada=>c.referencia(structuredClone(entrada)));
      if(state.lastExpected&&isDeepStrictEqual(expected,state.lastExpected)){
        const j=expected.findIndex(value=>!isDeepStrictEqual(value,expected[0]));
        if(j>0){[entradas[0],entradas[j]]=[entradas[j],entradas[0]];[expected[0],expected[j]]=[expected[j],expected[0]];}
      }
      state.lastExpected=expected;
      const execucao=randomBytes(24).toString('hex');
      state.execution={id:execucao,created:now(),entradas,expected};
      return {ok:true,execucao,entradas};
    },
    submissionLimit(session,id) {
      return station(session,id).c.modo==='testes'?TEST_CASES_LIMIT:undefined;
    },
    submit(session,id,executionId,body) {
      const {c,state}=station(session,id);active(session,state);
      const execution=state.execution;
      if(!execution||execution.id!==executionId)fail(409,'Execução inválida ou já utilizada.');
      if(now()-execution.created>=EXECUTION_TTL){state.execution=null;fail(409,'Execução expirada. Execute novamente.');}
      let resultados;
      if(c.modo==='testes'){
        let encoded;try{encoded=JSON.stringify(body);}catch{fail(400,'Envie uma lista de casos em JSON.');}
        if(encoded&&Buffer.byteLength(encoded,'utf8')>TEST_CASES_LIMIT)fail(413,'Casos de teste excedem 8 KB.');
        if(!body||!Array.isArray(body.casos)||body.casos.length<c.minimoCasos||body.casos.length>c.maximoCasos||
          body.casos.some(caso=>!Array.isArray(caso)||caso.length!==2||!c.validarEntrada(caso[0])||typeof caso[1]!=='boolean'))
          fail(400,'Envie de '+c.minimoCasos+' a '+c.maximoCasos+' casos válidos: [entrada, saída esperada].');
        resultados=body.casos.map(([entrada,esperado],i)=>{
          const passaNaCorreta=isDeepStrictEqual(esperado,c.referencia(structuredClone(entrada)));
          const falhaNaVibecodada=!isDeepStrictEqual(esperado,c.implementacaoVibecodada(structuredClone(entrada)));
          return {teste:i+1,entrada,passaNaCorreta,falhaNaVibecodada};
        });
      }else{
      if(!body||!Array.isArray(body.saidas)||body.saidas.length!==execution.entradas.length||
        (body.erro!==undefined&&(typeof body.erro!=='string'||!body.erro.length||body.erro.length>300)))
        fail(400,'Envie uma saída para cada entrada e, se necessário, uma mensagem de erro.');
      resultados=execution.entradas.map((entrada,i)=>{
        const passou=!body.erro&&(c.compararSaida?c.compararSaida(body.saidas[i],execution.expected[i]):isDeepStrictEqual(body.saidas[i],execution.expected[i]));
        return {teste:i+1,passou,entrada,recebido:body.saidas[i],...(passou?{}:{esperado:execution.expected[i]})};
      });
      }
      state.execution=null;
      const ok=c.modo==='testes'?resultados.every(r=>r.passaNaCorreta)&&resultados.some(r=>r.falhaNaVibecodada):resultados.every(r=>r.passou);
      const mensagem=c.modo==='testes'?(ok?'Seu teste revelou o bug.':resultados.some(r=>!r.passaNaCorreta)?
        'Seu teste não é válido: ele também falha na versão correta':'Seus testes passam, mas não pegam o bug'):undefined;
      let captura;
      if(ok){
        state.solved=true;
        if(!c.flagComposta||catalog.filter(part=>part.flagComposta&&part.flag===c.flag).every(part=>stateFor(session,part).solved)){
          captura=capturar(session,c.flag);
          // TODO tarefa 15: o app do Café em /lab deve consultar flag:pagamento-C nesta sessão
          // para aplicar a validação do catálogo/quantidade e a idempotência no servidor.
        }
        if(c.clueRef)progress.set(session,'clue:'+c.clueRef);
      }
      else{state.errors++;if(c.maxErros!==null&&state.errors>=c.maxErros)session.gameOver=true;}
      return {ok,...progress.state(session),resultados,erros:state.errors,gameOver:session.gameOver,
        ...(mensagem?{mensagem}:{}),...(captura?{captura}:{}),...(c.modo!=='testes'&&body.erro?{erroExecucao:body.erro}:{}),
        ...(ok?{recompensa:correctionReward(session,c),clueRef:c.clueRef,...(state.password?{senha:state.password}:{})}:{})};
    },
    hint(session,id) {
      const {c,state}=station(session,id);active(session,state);
      state.hints=Math.min(c.dicas.length,state.hints+1);
      return {ok:true,nivel:state.hints,dica:c.dicas[state.hints-1],esgotadas:state.hints===c.dicas.length};
    },
    unlock(session,id,body) {
      const {c,state}=station(session,id);
      if(!body||typeof body.senha!=='string'||body.senha.length>32)fail(400,'Senha deve ser um texto de até 32 caracteres.');
      if(session.gameOver)fail(409,'A partida terminou.');
      const index=legacy.indexOf(c),previous=index>0?stateFor(session,legacy[index-1]):null;
      const ok=index===0||!!(previous?.solved&&previous.password===body.senha);
      if(ok)state.unlocked=true;
      return {ok};
    }
  };
}
function installChallengeRoutes(router,sessions,service=createChallengeService()) {
  const sessionFor=req=>sessions.get(req)||fail(401,'Inicie uma nova partida.');
  router.add('GET','/api/jogo/desafios',(req,res)=>json(res,200,service.list(sessionFor(req),new URL(req.url,'http://localhost').searchParams.get('estacao'))));
  router.addPattern('POST',/^\/api\/jogo\/desafios\/([^/]+)\/execucao$/,async(req,res,[id])=>{
    const session=sessionFor(req);await readJson(req);json(res,200,service.start(session,id));
  });
  router.addPattern('POST',/^\/api\/jogo\/desafios\/([^/]+)\/execucao\/([^/]+)$/,async(req,res,[id,exec])=>{
    const session=sessionFor(req),body=await readJson(req,service.submissionLimit(session,id));json(res,200,service.submit(session,id,exec,body));
  });
  router.addPattern('POST',/^\/api\/jogo\/desafios\/([^/]+)\/dica$/,async(req,res,[id])=>{
    const session=sessionFor(req);await readJson(req);json(res,200,service.hint(session,id));
  });
}
module.exports={challenges,inputs,createChallengeService,installChallengeRoutes,EXECUTION_TTL};
