const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const repo = require('./server/data/repo.cjs');
const { validarReview } = require('./server/repo.cjs');
const { createApp } = require('./server/app.cjs');
const { createSessions } = require('./server/sessions.cjs');
async function verify(){
  assert.equal(repo.commits.length,12);assert.equal(new Set(repo.commits.map(c=>c.hash)).size,12);
  for(const c of repo.commits){assert(c.autor&&c.mensagem&&Number.isFinite(Date.parse(c.data)));assert.deepEqual(c.arquivos,c.diff.map(f=>f.arquivo));}
  for(let i=1;i<repo.commits.length;i++)assert(Date.parse(repo.commits[i].data)>Date.parse(repo.commits[i-1].data));
  const change=repo.commits.find(c=>c.hash==='7f2c9a1'),pr=repo.pullRequests[0];
  assert.equal(change.autor,'Rick');assert(change.data.includes('02:09:00'));assert.equal(change.mensagem,'refactor(retry): simplifica reenvio (gerado pelo Assistente de IA)');
  assert.equal(pr.numero,214);assert.equal(pr.titulo,'Retry mais simples');assert.equal(pr.aprovador,'bot-aprovador');assert.equal(pr.comentario,'LGTM 🚀');
  assert.equal((Date.parse(pr.aprovadaEm)-Date.parse(pr.abertaEm))/1000,40);assert.equal(pr.segundosAteAprovar,40);assert.deepEqual(pr.diff,change.diff);
  const lines=change.diff[0].linhas,old=repo.commits.find(c=>c.hash==='b20c002').diff[0].linhas.map(l=>l.texto);
  assert.deepEqual(lines.filter(l=>l.tipo!=='adicionada').map(l=>l.texto),old);
  assert.deepEqual(lines.filter(l=>l.tipo!=='removida').map(l=>l.texto),repo.blame['retry.js'].map(l=>l.texto));
  for(const line of repo.blame['retry.js']){
    assert(repo.commits.some(c=>c.hash===line.hash&&c.autor===line.autor));
    assert.equal(line.hash,lines.some(l=>l.tipo==='adicionada'&&l.texto===line.texto)?'7f2c9a1':'b20c002');
  }
  // Todas as combinações: somente o conjunto exato passa, sem linhas inofensivas.
  for(let mask=0;mask<2**lines.length;mask++){
    const selected=lines.filter((_,i)=>mask&(1<<i)).map(l=>l.id);
    assert.equal(validarReview(selected),JSON.stringify([...selected].sort())===JSON.stringify([...repo.linhasProblematicas].sort()));
  }
  assert(!validarReview([...repo.linhasProblematicas,'r2']));assert(!validarReview(null));
  console.log('Repo / dados: 12 commits, release 02:14, commit 7f2c9a1, PR #214 em 40 s, diff/blame coerentes e 256 combinações de review aprovados.');
  const app=createApp();await new Promise(resolve=>app.listen(0,'127.0.0.1',resolve));const base='http://127.0.0.1:'+app.address().port;
  async function call(path,body,cookie){
    const res=await fetch(base+path,{method:body===undefined?'GET':'POST',headers:{'Content-Type':'application/json',...(cookie?{Cookie:cookie}:{})},...(body===undefined?{}:{body:JSON.stringify(body)})});
    return {status:res.status,body:await res.json(),cookie:res.headers.get('set-cookie')?.split(';')[0]};
  }
  const endpoint='/api/jogo/repo/',query='?estacao=computer_dev_left',review=endpoint+'prs/214/review'+query;
  try{
    const paths=['historico','commits/7f2c9a1','blame?arquivo=retry.js','prs','prs/214'];
    const stationPath=path=>endpoint+path+(path.includes('?')?'&':'?')+'estacao=computer_dev_left';
    for(const path of paths)assert.equal((await call(stationPath(path))).status,401);
    assert.equal((await call(review,{linhas:[]})).status,401);
    const cookie=(await call('/api/jogo/nova-partida',{})).cookie,other=(await call('/api/jogo/nova-partida',{})).cookie;
    for(const path of paths){
      const result=await call(stationPath(path),undefined,cookie);assert.equal(result.status,200);
      for(const field of ['linhasProblematicas','flag','resposta','aliases','captura'])assert(!JSON.stringify(result.body).includes('"'+field+'"'));
      for(const station of ['computer_dev_right','computer_qa_upper','inexistente'])assert.equal((await call(stationPath(path).replace('computer_dev_left',station),undefined,cookie)).status,station==='computer_dev_right'?200:404);
    }
    assert.equal((await call(endpoint+'historico',undefined,cookie)).status,404);
    for(const path of ['commits/fffffff','prs/215','blame?arquivo=../retry.js'])assert.equal((await call(stationPath(path),undefined,cookie)).status,404);
    for(const path of ['/server/data/repo.cjs','/server/repo.cjs'])assert.equal((await call(path)).status,404);
    assert.equal((await call(endpoint+'historico'+query,{},cookie)).status,405);
    assert.equal((await call(review.replace('computer_dev_left','computer_qa_upper'),{linhas:repo.linhasProblematicas},cookie)).status,404);
    assert.equal((await call(review.replace('214','215'),{linhas:[]},cookie)).status,404);
    for(const body of [null,{}, {linhas:'r2'},{linhas:['r2','r2']},{linhas:['inexistente']},{linhas:[1]}])assert.equal((await call(review,body,cookie)).status,400);
    for(const selected of [[],['r2'],[...repo.linhasProblematicas,'r8']]){
      const wrong=(await call(review,{linhas:selected},cookie)).body;assert(!wrong.ok);assert(wrong.mensagem.startsWith('Revise de novo'));assert(!wrong.captura);
    }
    assert.equal((await call('/api/jogo/flags',undefined,cookie)).body.flags.length,0);
    assert.equal((await call('/api/jogo/eventos',{chave:'review:retry'},cookie)).status,403);
    assert.equal((await call('/api/jogo/eventos',{chave:'flag:retry-E'},cookie)).status,403);
    for(let i=0;i<2;i++){
      const correct=(await call(review,{linhas:[...repo.linhasProblematicas].reverse()},cookie)).body;
      assert(correct.ok&&correct.revisado);assert.equal(correct.captura.nova,i===0);assert.equal(correct.contagem.lembrancas,1);
      assert.equal(correct.captura.flag.ficha,'Código que ninguém leu não foi revisado — foi carimbado.');
    }
    assert((await call(stationPath('prs/214'),undefined,cookie)).body.revisado);
    assert(!(await call(stationPath('prs/214'),undefined,other)).body.revisado);
    const questions=(await call('/api/jogo/perguntas',undefined,cookie)).body.perguntas;
    for(const q of questions)for(const field of ['resposta','aliases','flag'])assert(!(field in q));
    assert.deepEqual(questions.find(q=>q.id==='responsavel').opcoes,['Edu','Rick','Mark','Steve']);
    assert.deepEqual(questions.find(q=>q.id==='como-fez').opcoes,['À mão','Gerado pelo assistente de IA','Copiado de um fórum']);
    assert(!(await call('/api/jogo/perguntas/historico',{resposta:'7f2c9a'},cookie)).body.ok);
    for(const [i,resposta] of [' 7F2C9A1 ','7f2'].entries()){
      const result=(await call('/api/jogo/perguntas/historico',{resposta},cookie)).body;
      assert(result.ok);assert.equal(result.captura.nova,i===0);assert.equal(result.contagem.flags,2);assert.equal(result.contagem.lembrancas,2);
    }
    for(const [id,resposta] of [['responsavel','Rick'],['como-fez','Gerado pelo assistente de IA']]){
      const result=(await call('/api/jogo/perguntas/'+id,{resposta},cookie)).body;assert(result.ok);assert(!result.captura);assert.equal(result.contagem.flags,2);
    }
    await call('/api/jogo/nova-partida',{},cookie);
    assert(!(await call(stationPath('prs/214'),undefined,cookie)).body.revisado);
    assert.equal((await call('/api/jogo/flags',undefined,cookie)).body.lembrancas,0);
    assert((await call(review,{linhas:repo.linhasProblematicas},cookie)).body.captura.nova);
    const sessions=createSessions(),session=sessions.create({setHeader(){}});session.repoErros=3;sessions.reset(session);assert.equal(session.repoErros,0);
    console.log('Repo / HTTP: sessão, estações, gabarito privado, dados somente leitura, review errado/parcial/extra, acerto após três erros, captura única, perguntas e alias, isolamento e reset aprovados.');
  }finally{await new Promise(resolve=>app.close(resolve));}

  class Element{
    constructor(tag){this.tagName=tag;this.children=[];this.attrs={};this.disabled=false;this.isConnected=true;this.classList={add:()=>{}};}
    append(...children){this.children.push(...children);}replaceChildren(...children){this.children=children;this.textContent='';}setAttribute(name,value){this.attrs[name]=value;}
    querySelectorAll(selector){return this.children.flatMap(child=>[...(selector==='.git-line'&&child.className?.split(' ').includes('git-line')?[child]:[]),...child.querySelectorAll(selector)]);}
  }
  let response={ok:false,mensagem:'Revise de novo.'},calls=0,payload;
  const scope=vm.createContext({document:{createElement:tag=>new Element(tag)},api:{
    get:async path=>{
      if(path.includes('/historico?'))return {commits:[change]};
      if(path.includes('/commits/'))return {commit:change};
      if(path.includes('/blame?'))return {linhas:repo.blame['retry.js']};
      if(path.includes('/prs/214?'))return {pr,revisado:false};
      return {prs:[pr]};
    },
    post:async(path,body)=>{assert.equal(path,review);calls++;payload=body;return response;}
  }});
  vm.runInContext(fs.readFileSync('engine/os/apps/git.js','utf8')+'\nthis.app=ZERO_GIT_APP;',scope);
  assert.deepEqual(Array.from(scope.app.availableAt),['computer_dev_left','computer_dev_right']);assert(fs.existsSync(scope.app.icon));
  const root=new Element('div');await scope.app.open({window:{body:root},station:{id:'computer_dev_left'}});
  const nav=root.children[1],content=root.children[2];await content.children[0].children[0].onclick();assert.equal(content.children[1].querySelectorAll('.git-line').length,8);
  await nav.children[1].onclick();assert.equal(content.children[1].children.length,5);
  await nav.children[2].onclick();await content.children[0].children[0].onclick();
  let detail=content.children[1],uiLines=detail.querySelectorAll('.git-line');
  assert.equal(uiLines.length,8);uiLines[1].onclick();assert.equal(uiLines[1].attrs['aria-pressed'],'true');uiLines[1].onclick();assert.equal(uiLines[1].attrs['aria-pressed'],'false');
  for(const id of repo.linhasProblematicas)uiLines[lines.findIndex(l=>l.id===id)].onclick();
  const send=detail.children[detail.children.length-2],status=detail.children[detail.children.length-1];
  await send.onclick();assert.deepEqual(Array.from(payload.linhas),repo.linhasProblematicas);assert.equal(status.textContent,'Revise de novo.');assert(!send.disabled);
  response=Promise.reject(new Error('Sem conexão'));await send.onclick();assert.equal(status.textContent,'Sem conexão');assert(!send.disabled);
  let release;response=new Promise(resolve=>{release=resolve;});const pending=send.onclick(),before=calls;await send.onclick();assert.equal(calls,before);
  release({ok:true,mensagem:'Revisão concluída.'});await pending;assert(send.disabled);assert(uiLines.every(line=>line.disabled));
  await content.children[0].children[0].onclick();detail=content.children[1];const lateSend=detail.children[detail.children.length-2],lateStatus=detail.children[detail.children.length-1];
  response=new Promise(resolve=>{release=resolve;});const late=lateSend.onclick();await nav.children[1].onclick();release({ok:true,mensagem:'Tardia'});await late;assert.notEqual(lateStatus.textContent,'Tardia');
  assert(fs.readFileSync('index.html','utf8').includes('engine/os/apps/git.js'));
  console.log('Repo / UI: registro e ícone, abas, commit e blame, marcação/desmarcação, envio ao servidor, erro de rede, retry, envio duplicado, sucesso e resposta tardia aprovados.');
}
verify().catch(error=>{console.error(error);process.exitCode=1;});
