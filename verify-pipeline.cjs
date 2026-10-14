const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const http = require('node:http');
const dados = require('./server/data/pipeline.cjs');
const { validarYaml } = require('./server/pipeline.cjs');
const { createApp } = require('./server/app.cjs');
async function verify(){
  const correto=dados.yaml.replace('allow_failure: true','allow_failure: false');
  assert.equal(dados.execucoes.length,5);assert(dados.yaml.includes('# temporário — liberar a sexta (Kael)'));
  const release=dados.execucoes.find(run=>run.versao==='2.1');assert.equal(release.testes,'FALHOU (2 SKIP, 1 FAIL) → permitido');assert.equal(release.deploy,'OK 02:14:00');
  assert.equal(validarYaml(correto),null);
  assert.equal(validarYaml(correto.replace(/  allow_failure:.*\n/,'')),null);
  for(const needs of ['needs: testes',"needs: ['testes']",'needs:\n    - testes'])assert.equal(validarYaml(correto.replace('needs: [testes]',needs)),null);
  const invalidos=[dados.yaml,correto.replace(/testes:\n[\s\S]*?deploy:/,'deploy:'),correto.replace('needs: [testes]','needs: [build]'),correto.replace('deploy:','publicar:'),
    correto.replace('build:','compilar:'),correto+'testes:\n  allow_failure: true\n',correto.replace('allow_failure: false','allow_failure: false\n  allow_failure: true'),
    correto.replace('needs: [testes]','needs: [testes]\n  needs: [build]'),correto.replace('testes:','testes: {allow_failure: true}'),correto.replace('allow_failure: false','allow_failure: "false"'),
    correto.replace('allow_failure: false','<<: *excecao'),correto.replace('  needs:','\tneeds:'),correto.replace('script: executar testes','script: |\n    allow_failure: false')];
  for(const yaml of invalidos)assert.equal(typeof validarYaml(yaml),'string',yaml);
  console.log('Pipeline / dados e YAML: cinco execuções, evidência do 2.1, false/ausente, três formatos de needs, regras obrigatórias, duplicatas e sintaxe ambígua aprovados.');
  const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.address().port;
  async function call(path,body,cookie){
    const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
  }
  const endpoint='/api/jogo/pipeline',get=endpoint+'?estacao=computer_qa_upper';
  try{
    assert.equal((await call(get)).status,401);assert.equal((await call(endpoint,{yaml:correto})).status,401);
    const cookie=(await call('/api/jogo/nova-partida',{})).cookie,other=(await call('/api/jogo/nova-partida',{})).cookie;
    for(const station of ['computer_qa_upper','computer_qa_infra_lower','computer_dev_left','inexistente'])assert.equal((await call(endpoint+'?estacao='+station,undefined,cookie)).status,station.startsWith('computer_qa_')?200:404);
    assert.equal((await call(endpoint,undefined,cookie)).status,404);
    const initial=(await call(get,undefined,cookie)).body;assert.equal(initial.yaml,dados.yaml);assert(!JSON.stringify(initial).includes('pipeline-P'));assert(!JSON.stringify(initial).includes('lembranca'));
    for(const path of ['/server/data/pipeline.cjs','/server/pipeline.cjs'])assert.equal((await call(path)).status,404);
    for(const body of [null,{}, {yaml:3},{yaml:' '}])assert.equal((await call(endpoint,body,cookie)).status,400);
    assert.equal((await call(endpoint,{yaml:'é'.repeat(2100)},cookie)).status,413);
    // Sem Content-Length: o limite também vale para transferência em chunks.
    await new Promise((resolve,reject)=>{
      const req=http.request(base+endpoint,{method:'POST',headers:{'Content-Type':'application/json',Cookie:cookie}},res=>{assert.equal(res.statusCode,413);res.resume();res.on('end',resolve);});req.on('error',reject);req.write('{"yaml":"');req.write('x'.repeat(4200));req.end('"}');
    });
    for(const yaml of invalidos){const result=await call(endpoint,{yaml},cookie);assert.equal(result.status,200);assert(!result.body.ok&&result.body.mensagem);assert(!result.body.captura);}
    assert.equal((await call(get,undefined,cookie)).body.yaml,dados.yaml);assert.equal((await call('/api/jogo/flags',undefined,cookie)).body.lembrancas,0);
    assert.equal((await call('/api/jogo/eventos',{chave:'flag:pipeline-P'},cookie)).status,403);
    const question=(await call('/api/jogo/perguntas',undefined,cookie)).body.perguntas.find(q=>q.id==='pipeline');assert(question.disponivel);assert.equal(question.tipo,'escolha');assert(!('resposta' in question));
    for(const resposta of ['Bloqueou o deploy','Não executou'])assert(!(await call('/api/jogo/perguntas/pipeline',{resposta},cookie)).body.ok);
    const answer=(await call('/api/jogo/perguntas/pipeline',{resposta:'Permitiu o deploy'},cookie)).body;assert(answer.ok);assert(!answer.captura);assert.equal(answer.contagem.flags,0);
    for(let i=0;i<2;i++){
      const result=(await call(endpoint,{yaml:correto},cookie)).body;assert(result.ok);assert.equal(result.captura.nova,i===0);assert.equal(result.contagem.lembrancas,1);assert(result.progresso.includes('flag:pipeline-P'));
      assert.equal(result.captura.flag.lembranca,"Fui eu que montei essa pipeline. Fui eu que deixei essa exceção 'temporária'.");
    }
    assert.equal((await call(get,undefined,cookie)).body.yaml,correto);assert.equal((await call(get,undefined,other)).body.yaml,dados.yaml);
    assert.equal((await call('/api/jogo/flags',undefined,other)).body.lembrancas,0);
    await call('/api/jogo/nova-partida',{},cookie);assert.equal((await call(get,undefined,cookie)).body.yaml,dados.yaml);assert.equal((await call('/api/jogo/flags',undefined,cookie)).body.lembrancas,0);
    console.log('Pipeline / HTTP: sessão, estações de leitura, dados privados, entradas inválidas, 413 com tamanho declarado/chunks, regras, captura única, lembrança, pergunta sem flag, isolamento e reset aprovados.');
  }finally{await new Promise(resolve=>app.close(resolve));}
  class Element{
    constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.isConnected=true;this.classList={add(){}};}
    append(...children){this.children.push(...children);}setAttribute(key,value){this.attrs[key]=value;}
  }
  let response={ok:false,mensagem:'Corrija os testes.'},calls=0,payload;
  const scope=vm.createContext({document:{createElement:tag=>new Element(tag)},api:{get:async path=>{assert.equal(path,get);return dados;},post:async(path,body)=>{assert.equal(path,endpoint);calls++;payload=body;return response;}}});
  vm.runInContext(fs.readFileSync('engine/os/apps/pipeline.js','utf8')+'\nthis.app=ZERO_PIPELINE_APP;',scope);
  assert.deepEqual(Array.from(scope.app.availableAt),['computer_qa_upper','computer_qa_infra_lower']);assert(fs.existsSync(scope.app.icon));
  const body=new Element('div');await scope.app.open({window:{body},station:{id:'computer_qa_upper'}});
  const [,nav,runs,config,status]=body.children;assert(!runs.hidden&&config.hidden);assert.equal(runs.children.length,6);
  runs.children[0].children[0].onclick();assert(runs.children[5].textContent.includes('2 SKIP, 1 FAIL'));
  nav.children[1].onclick();assert(runs.hidden&&!config.hidden);const editor=config.children[1].children[0],save=config.children[2];assert.equal(editor.value,dados.yaml);
  editor.value=correto;await save.onclick();assert.equal(payload.yaml,correto);assert.equal(status.textContent,'Corrija os testes.');assert(!save.disabled);
  response=Promise.reject(new Error('Sem conexão'));await save.onclick();assert.equal(status.textContent,'Sem conexão');assert(!save.disabled);
  let releaseResponse;response=new Promise(resolve=>{releaseResponse=resolve;});const pending=save.onclick(),before=calls;await save.onclick();assert.equal(calls,before);
  releaseResponse({ok:true,mensagem:'Configuração salva.'});await pending;assert.equal(status.textContent,'Configuração salva.');assert(!save.disabled);
  response=new Promise(resolve=>{releaseResponse=resolve;});const late=save.onclick();body.isConnected=false;releaseResponse({ok:true,mensagem:'Tardia'});await late;assert.notEqual(status.textContent,'Tardia');
  assert(fs.readFileSync('index.html','utf8').includes('engine/os/apps/pipeline.js'));
  console.log('Pipeline / UI: registro, abas, log do 2.1, editor, envio ao servidor, erro de regra/rede, nova tentativa, envio duplicado e resposta após fechar aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
