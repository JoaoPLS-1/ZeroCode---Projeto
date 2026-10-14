const fs = require('node:fs');
const path = require('node:path');
const { randomBytes, randomInt } = require('node:crypto');
const { isDeepStrictEqual } = require('node:util');
const progress = require('./progress.cjs');
const { capturar } = require('./flags.cjs');
const { readJson, json } = require('./router.cjs');
const EXECUTION_TTL = 60000;
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
    if(!c||!progress.requires(session,c.requires))fail(404,'Desafio não encontrado.');
    return {c,state:stateFor(session,c)};
  }
  function active(session,state) {
    if(session.gameOver)fail(409,'A partida terminou. Inicie uma nova investigação.');
    if(!state.unlocked)fail(403,'Estação protegida.');
    if(state.solved)fail(409,'Missão já resolvida.');
  }
  function publicData(session,c) {
    const state=stateFor(session,c);
    // Lista explícita: nunca serializar referências, testes privados, flags ou dicas futuras.
    return {id:c.id,titulo:c.titulo,arquivo:c.arquivo,enunciado:c.enunciado,codigoInicial:c.codigoInicial,modo:c.modo,
      maxErros:c.maxErros,bloqueada:!state.unlocked,resolvida:state.solved,erros:state.errors,dicasUsadas:state.hints,
      ...(state.hints?{dica:c.dicas[state.hints-1]}:{}),...(Number.isInteger(c.ordemS2)?{ordemS2:c.ordemS2}:{}),
      ...(state.solved?{recompensa:c.recompensa,clueRef:c.clueRef,...(state.password?{senha:state.password}:{})}:{})};
  }
  return {
    list(session,estacao) {
      if(typeof estacao!=='string'||!estacao)fail(400,'Informe a estação.');
      return {ok:true,...progress.state(session),gameOver:session.gameOver,
        desafios:catalog.filter(c=>c.estacoes.includes(estacao)&&progress.requires(session,c.requires)).map(c=>publicData(session,c))};
    },
    legacyList(session) {
      return {ok:true,...progress.state(session),gameOver:session.gameOver,missoes:legacy.map(c=>{
        const m=publicData(session,c);
        return {...m,name:m.titulo,file:m.arquivo,starter:m.codigoInicial,manual:m.enunciado};
      })};
    },
    start(session,id) {
      const {c,state}=station(session,id);active(session,state);
      const entradas=inputs(c),expected=entradas.map(entrada=>c.referencia(structuredClone(entrada)));
      if(state.lastExpected&&isDeepStrictEqual(expected,state.lastExpected)){
        const j=expected.findIndex(value=>!isDeepStrictEqual(value,expected[0]));
        if(j>0){[entradas[0],entradas[j]]=[entradas[j],entradas[0]];[expected[0],expected[j]]=[expected[j],expected[0]];}
      }
      state.lastExpected=expected;
      const execucao=randomBytes(24).toString('hex');
      state.execution={id:execucao,created:now(),entradas,expected};
      return {ok:true,execucao,entradas};
    },
    submit(session,id,executionId,body) {
      const {c,state}=station(session,id);active(session,state);
      const execution=state.execution;
      if(!execution||execution.id!==executionId)fail(409,'Execução inválida ou já utilizada.');
      if(now()-execution.created>=EXECUTION_TTL){state.execution=null;fail(409,'Execução expirada. Execute novamente.');}
      if(!body||!Array.isArray(body.saidas)||body.saidas.length!==execution.entradas.length||
        (body.erro!==undefined&&(typeof body.erro!=='string'||!body.erro.length||body.erro.length>300)))
        fail(400,'Envie uma saída para cada entrada e, se necessário, uma mensagem de erro.');
      state.execution=null;
      const resultados=execution.entradas.map((entrada,i)=>{
        const passou=!body.erro&&isDeepStrictEqual(body.saidas[i],execution.expected[i]);
        return {teste:i+1,passou,entrada,recebido:body.saidas[i],...(passou?{}:{esperado:execution.expected[i]})};
      });
      const ok=resultados.every(r=>r.passou);
      let captura;
      if(ok){captura=capturar(session,c.flag);state.solved=true;if(c.clueRef)progress.set(session,'clue:'+c.clueRef);}
      else{state.errors++;if(c.maxErros!==null&&state.errors>=c.maxErros)session.gameOver=true;}
      return {ok,...progress.state(session),resultados,erros:state.errors,gameOver:session.gameOver,
        ...(captura?{captura}:{}),...(body.erro?{erroExecucao:body.erro}:{}),
        ...(ok?{recompensa:c.recompensa,clueRef:c.clueRef,...(state.password?{senha:state.password}:{})}:{})};
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
    const session=sessionFor(req),body=await readJson(req);json(res,200,service.submit(session,id,exec,body));
  });
  router.addPattern('POST',/^\/api\/jogo\/desafios\/([^/]+)\/dica$/,async(req,res,[id])=>{
    const session=sessionFor(req);await readJson(req);json(res,200,service.hint(session,id));
  });
}
module.exports={challenges,inputs,createChallengeService,installChallengeRoutes,EXECUTION_TTL};
