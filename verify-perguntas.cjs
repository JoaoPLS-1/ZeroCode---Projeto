const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const vm = require('node:vm');
const { createApp } = require('./server/app.cjs');
const { createRouter } = require('./server/router.cjs');
const { createSessions } = require('./server/sessions.cjs');
const { normalizar, installPerguntaRoutes } = require('./server/perguntas.cjs');
const { perguntas } = require('./server/data/perguntas.cjs');
const { VFS_FILES } = require('./server/data/vfs.cjs');
const vfs = require('./server/vfs.cjs');
const RemoteFS = require('./engine/os/vfs.js');
const { createTerminal } = require('./engine/os/terminal-core.js');
async function listen(server){await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));return 'http://127.0.0.1:'+server.address().port;}
async function call(base,path,body,cookie){
  const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
  return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0],retry:res.headers.get('retry-after')};
}
async function verify(){
  assert.equal(normalizar('  assistente   de\tIA \n'),'ASSISTENTE DE IA');
  assert.equal(new Set(perguntas.map(q=>q.id)).size,perguntas.length);
  assert.deepEqual(perguntas.filter(q=>q.flag).map(q=>q.flag),['pagamento-D']);
  for(const q of perguntas){assert(q.dica&&q.conclusao);assert(['valor','escolha'].includes(q.tipo));if(q.opcoes)assert(q.opcoes.includes(q.resposta));}
  const lines=VFS_FILES['/var/log/cobrancas.log'].content.split('\n');assert.equal(lines.length,40);
  const repeated=lines.filter(line=>line.includes('REQ-7F2-0412'));assert.equal(repeated.length,3);
  repeated.forEach(line=>assert(line.includes('cliente=C-1088 valor=29.90')));
  assert.deepEqual(repeated.map(line=>line.slice(0,8)),['02:14:14','02:14:15','02:14:16']);
  const others=lines.filter(line=>!line.includes('REQ-7F2-0412')).map(line=>line.match(/request_id=(\S+)/)[1]);assert.equal(new Set(others).size,37);
  for(const station of ['computer_dev_left','computer_qa_upper','computer_infra_upper'])assert.equal(vfs.read({progresso:[]},station,'/var/log/cobrancas.log'),null);
  for(const station of ['computer_dev_right','computer_qa_infra_lower'])assert(vfs.read({progresso:[]},station,'/var/log/cobrancas.log'));
  console.log('Perguntas / dados: roteiro, normalização, flag exclusiva, 40 cobranças, três repetições e estações autorizadas aprovados.');
  const app=createApp(),base=await listen(app),endpoint='/api/jogo/perguntas';
  try{
    assert.equal((await call(base,endpoint)).status,401);assert.equal((await call(base,endpoint+'/pagamento',{resposta:'x'})).status,401);
    const cookie=(await call(base,'/api/jogo/nova-partida',{})).cookie;
    const initial=(await call(base,endpoint,undefined,cookie)).body;
    assert.equal(initial.perguntas.length,perguntas.length);
    initial.perguntas.forEach(q=>{assert(!('resposta' in q));assert(!('flag' in q));assert(!('conclusao' in q));assert.equal(q.respondida,false);});
    assert(!JSON.stringify(initial).includes('REQ-7F2-0412'));
    assert.equal((await call(base,endpoint+'/pipeline',{resposta:'allow_failure: true'},cookie)).status,404);
    assert.equal((await call(base,endpoint+'/inexistente',{resposta:'x'},cookie)).status,404);
    for(const body of [null,{}, {resposta:42},{resposta:' '},{resposta:'x'.repeat(501)}])assert.equal((await call(base,endpoint+'/pagamento',body,cookie)).status,400);
    const wrong=await call(base,endpoint+'/pagamento',{resposta:'errada'},cookie);assert.equal(wrong.body.ok,false);assert(!JSON.stringify(wrong).includes('REQ-7F2-0412'));
    const before=(await call(base,'/api/jogo/estado',undefined,cookie)).body;assert(!before.progresso.includes('q:pagamento'));assert.equal(before.contagem.lembrancas,0);
    for(let i=0;i<2;i++){
      const correct=await call(base,endpoint+'/pagamento',{resposta:'  req-7f2-0412  '},cookie);
      assert(correct.body.ok&&correct.body.respondida&&correct.body.conclusao);assert.equal(correct.body.captura.nova,i===0);
      assert.equal(correct.body.contagem.lembrancas,1);assert.equal(correct.body.contagem.flags,1);
      assert(correct.body.progresso.includes('q:pagamento'));assert(!JSON.stringify(correct).includes('REQ-7F2-0412'));
    }
    const answered=(await call(base,endpoint,undefined,cookie)).body.perguntas.find(q=>q.id==='pagamento');assert(answered.respondida&&answered.conclusao);assert(!('resposta' in answered));
    const nonFlag=await call(base,endpoint+'/como-fez',{resposta:'  gerado  inteiro pelo ASSISTENTE '},cookie);assert(nonFlag.body.ok);assert(!nonFlag.body.captura);assert.equal(nonFlag.body.contagem.flags,1);
    const cards=(await call(base,'/api/jogo/flags',undefined,cookie)).body;assert.equal(cards.flags.length,1);assert.equal(cards.flags[0].conceito,'Idempotência');assert(cards.flags[0].ficha&&cards.flags[0].lembranca);
    const other=(await call(base,'/api/jogo/nova-partida',{})).cookie;assert((await call(base,endpoint,undefined,other)).body.perguntas.every(q=>!q.respondida));
    assert.equal((await call(base,'/api/jogo/eventos',{chave:'q:pagamento'},other)).status,403);
    for(const path of ['/server/perguntas.cjs','/server/data/perguntas.cjs'])assert.equal((await call(base,path)).status,404);
    const logPath='/api/jogo/fs/arquivo?estacao=computer_dev_right&caminho=/var/log/cobrancas.log';
    const remote=new RemoteFS({get:async path=>{const result=await call(base,path,undefined,other);if(result.status!==200)throw new Error('Leitura recusada');return result.body;}},'computer_dev_right');
    const term=createTerminal(remote),output=await term.run('grep REQ /var/log/cobrancas.log');assert.equal(output.lines.filter(line=>line.includes('REQ-7F2-0412')).length,3);
    assert.equal((await call(base,logPath,undefined,other)).status,200);assert.equal((await call(base,logPath.replace('computer_dev_right','computer_dev_left'),undefined,other)).status,404);
    await call(base,'/api/jogo/nova-partida',{},cookie);assert((await call(base,endpoint,undefined,cookie)).body.perguntas.every(q=>!q.respondida));assert.equal((await call(base,'/api/jogo/flags',undefined,cookie)).body.lembrancas,0);
    console.log('Perguntas / HTTP: sessão, respostas privadas, indisponíveis, erros neutros, validação, captura única com ficha e lembrança, perguntas sem flag, isolamento, eventos forjados, reset, VFS e grep aprovados.');
  }finally{await new Promise(resolve=>app.close(resolve));}
  let time=0;const router=createRouter(),sessions=createSessions({now:()=>time});let cookie;
  const session=sessions.create({setHeader(name,value){cookie=value.split(';')[0];}});installPerguntaRoutes(router,sessions,{now:()=>time});
  const timed=http.createServer((req,res)=>router.handle(req,res,req.url)),timedBase=await listen(timed);
  try{
    for(let i=0;i<10;i++)assert.equal((await call(timedBase,endpoint+'/'+(i%2?'sistema':'pagamento'),{resposta:'errada'},cookie)).status,200);
    time=59999;const blocked=await call(timedBase,endpoint+'/pagamento',{resposta:'REQ-7F2-0412'},cookie);assert.equal(blocked.status,429);assert.equal(blocked.retry,'1');
    time=60000;assert((await call(timedBase,endpoint+'/pagamento',{resposta:'REQ-7F2-0412'},cookie)).body.ok);
    sessions.reset(session);assert.equal(session.perguntasTentativas.length,0);assert.equal(session.progresso.length,0);
    console.log('Perguntas / limite: dez tentativas por sessão entre todas as perguntas, 11ª recusada, expiração em 60 segundos e reset aprovados.');
  }finally{await new Promise(resolve=>timed.close(resolve));}

  class Element{
    constructor(tag){this.tagName=tag.toUpperCase();this.children=[];this.attrs={};this.isConnected=true;this.value='';}
    append(...children){this.children.push(...children);}replaceChildren(){this.children=[];}setAttribute(name,value){this.attrs[name]=value;}
  }
  let response={ok:false,mensagem:'Continue investigando.'},calls=0;
  const scope=vm.createContext({document:{createElement:tag=>new Element(tag)},Game:class{},api:{get:async()=>({perguntas:[{id:'pagamento',ordem:1,pergunta:'Identificador?',tipo:'valor',disponivel:true,respondida:false,dica:'Leia o log.'},{id:'pipeline',ordem:2,pergunta:'Pipeline?',tipo:'valor',disponivel:false,respondida:false,dica:'Aguarde.'}]}),post:async(path,body)=>{calls++;assert.equal(path,endpoint+'/pagamento');assert.equal(body.resposta,'teste');return response;}}});
  vm.runInContext(fs.readFileSync('engine/case.js','utf8')+'\nthis.CaseExperience=CaseExperience;',scope);
  const experience=Object.create(scope.CaseExperience.prototype),root=new Element('section');await experience.renderQuestions(root);
  assert.equal(root.children.length,2);assert.equal(root.children[1].children.length,3);
  const card=root.children[0],status=card.children[2],form=card.children[3],field=form.children[0].children[0],send=form.children[1];field.value='teste';
  await form.onsubmit({preventDefault(){}});assert.equal(status.textContent,response.mensagem);assert.equal(send.disabled,false);
  response=Promise.reject(new Error('Sem conexão'));await form.onsubmit({preventDefault(){}});assert.equal(status.textContent,'Sem conexão');assert.equal(send.disabled,false);
  let release;response=new Promise(resolve=>{release=resolve;});const pending=form.onsubmit({preventDefault(){}}),before=calls;await form.onsubmit({preventDefault(){}});assert.equal(calls,before);
  release({ok:true,conclusao:'Identifiquei a repetição.'});await pending;assert.equal(send.disabled,true);assert.equal(field.value,'');assert(status.textContent.includes('Respondida ✓'));assert(status.textContent.includes('Identifiquei a repetição.'));
  const lateRoot=new Element('section');await experience.renderQuestions(lateRoot);const lateForm=lateRoot.children[0].children[3];lateForm.children[0].children[0].value='teste';
  response=new Promise(resolve=>{release=resolve;});const late=lateForm.onsubmit({preventDefault(){}});lateRoot.isConnected=false;release({ok:true,conclusao:'Tardia'});await late;assert(!lateRoot.children[0].children[2].textContent.includes('Tardia'));
  console.log('Perguntas / UI: lista, conteúdo indisponível, erro, falha de conexão, envio duplicado, conclusão, bloqueio após acerto e resposta tardia aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
